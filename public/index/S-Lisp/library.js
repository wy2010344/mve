({
	data:{
		s:"./s.js",
        interpret:"./interpret.js",
        System:"./System.js"
	},
    //致力于变成多平台通用的文件
	success:function(log) {
		var library={
            "js-eval":function(args){
                return eval(args.First());
            },
            /*
            *o k (ps)
            */
            "js-call":function(args){
                var o=args.First();
                if(typeof(o)=='string'){
                    o=eval(o);
                }
                args=args.Rest();
                var n=args.First();
                var ps=[];
                var as=[];
                args=args.Rest();
                if(args){
                    ps=lib.s.array_from_list(args.First());
                    for(var i=0;i<ps.length;i++){
                        as.push("ps["+i+"]");
                    }
                }
                var str="o[n]("+as.join(",")+")";
                //mb.log(ps);
                return eval(str);
            },
            "js-attr":function(args){
                var o=args.First();
                if(typeof(o)=='string'){
                    o=eval(o);
                }
                args=args.Rest();
                var n=args.First();
                args=args.Rest();
                if(args){
                    //设置值
                    o[n]=args.First();
                }else{
                    //取值
                    return o[n];
                }
            }
		};
        var core=lib.System({
            log:log||function(cs){
                mb.log.apply(null,cs)
            },
            isList:function(n){
                return n.isList;
            },
            isFun:function(f){
                return f.isFun;
            },
            toString:lib.s.toString,
            Fun:lib.interpret.Fun
        });
        mb.Object.forEach(library,
            function(v,k){
                if(typeof(v)=='function'){
                    v=lib.interpret.buildLibFun(k,v);
                }
                core=lib.s.kvs_extend(k,v,core);
            }
        );
        /************Cache函数**************/
        var Cache=function(v){
            this.v=v;
        };
        Cache.prototype=new lib.interpret.Fun();
        mb.Object.ember(Cache.prototype,{
            toString:function() {
                return "[]";
            },
            ftype:function() {
                return this.Function_type.cache;
            },
            exec:function(args){
                if(args==null){
                    return this.v;
                }else{
                    this.v=args.First();
                }
            }
        });
        core=lib.s.kvs_extend(
            "cache",
            lib.interpret.buildLibFun(
                "cache",
                function(args) {
                    var v=args.First();
                    return new Cache(v);
                }
            ),
            core
        );
        return core;
	}
})