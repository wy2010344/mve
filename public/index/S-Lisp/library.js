({
	data:{
		s:"./s.js",
        interpret:"./interpret.js"
	},
    //致力于变成多平台通用的文件
	success:function(log) {
		log=log||function(cs){
			mb.log.apply(null,cs)
		};
        var or=function(a,b){
            return a||b;
        };
        var and=function(a,b){
            return a&&b;
        };
        var reduce=function(node,func,init) {
            for(var t=node;t!=null;t=t.Rest()){
                init=func(init,t.First());
            }
            return init;
        };
        var compare=function(node,func){
            var last=node.First();
            var init=true;
            for(var t=node.Rest();t!=null;t=t.Rest()){
                var now=t.First();
                init=and(init,func(last,now));
                last=now;
            }
            return init;
        };
		var library={
            "false":false,
            "true":true,
			log:function(node){
				var cs=[];
				for(var t=node;t!=null;t=t.Rest()){
					cs.push(lib.s.log(t.First()));
				}
				log(cs);
			},
            reverse:function(node){
                var v=node.First();
                return lib.s.reverse(node.First());
            },
            rest:function(node){
                var v=node.First();
                return v.Rest();
            },
            first:function(node){
                var v=node.First();
                return v.First();
            },
            /*主要用于用闭包构建参数*/
            list:function(node){
                return node;
            },
            "empty?":function(node){
                return (node.First()==null);
            },
            "exist?":function(node) {
                return (node.First()!=null);
            },
            type:function(node) {
                var n=node.First();
                if(n==null){
                    return "list";
                }else{
                    if(n.isList){
                        return "list";
                    }else
                    if(n.isFun){
                        return "function";
                    }else{
                        var t=typeof(n);
                        if(t=="string"){
                            return "string";
                        }else
                        if(t=="boolean"){
                            return "bool";
                        }else
                        if(t=="number"){
                            if(n%1===0){
                                return "int";
                            }else{
                                return "float";
                            }
                        }else{
                            return t;
                        }
                    }
                }
            },
            "str-eq":function(node) {
                return compare(node,function(last,now){
                    return (last==now);
                });
            },
            "str-at":function(node) {
                var str=node.First();
                node=node.Rest();
                var index=node.First();  
                return str[index];
            },
            "str-indexOf":function(node) {
                var str=node.First();
                node=node.Rest();
                var v=node.First();
                return str.indexOf(v);
            },
            "str-lastIndexOf":function(node) {
                var str=node.First();
                node=node.Rest();
                var v=node.First();
                return str.lastIndexOf(v);
            },
            "str-startsWith":function(node) {
                var str=node.First();
                node=node.Rest();
                var v=node.First();
                return str.startsWith(v);
            },
            "str-endsWith":function(node) {
                var str=node.First();
                node=node.Rest();
                var v=node.First();
                return str.endsWith(v);
            },
            length:function(node){
                return node.First().Length();
            },
            extend:function(node){
            	return lib.s.extend(node.First(),node.Rest().First());
            },
			quote:function(node){
				return node.First();
			},
            "parseInt":function(node){
                return parseInt(node.First());
            },
            "kvs-find1st":function(node){
                var kvs=node.First();
                node=node.Rest();
                var key=node.First();
                return lib.s.kvs_find1st(kvs,key);
            },
            "kvs-extend":function(node) {
                var key=node.First();
                node=node.Rest();
                var value=node.First();
                node=node.Rest();
                var kvs=node.First();
                return lib.s.kvs_extend(key,value,kvs);
            },
            //a?b:default(null)
            "if":function(node){
                if(node.First()){
                    return node.Rest().First();
                }else{
                    node=node.Rest().Rest();
                    if(node){
                        return node.First();
                    }else{
                        return null;
                    }
                }
            },
            "str-join":function(node){
                //字符串
                var array=node.First();
                var split="";
                if(node.Rest()!=null){
                    split=node.Rest().First();
                }
                var r="";
                for(var t=array;t!=null;t=t.Rest()){
                    r=r+t.First()+split;
                }
                return r.substr(0,r.length-split.length);
            },
            stringify:function(node){
                //类似于JSON.stringify，没想好用toString还是stringify;
                return node.First().toString();  
            },
            "str-trim":function(node) {
                var str=node.First();
                return str.trim();
            },
            "str-length":function(node) {
                var str=node.First();
                return str.length;
            },
			"+":function(node){
                return reduce(node,function(last,now){
                    return last+now;
                },0);
			},
			"-":function(node){
                var r=node.First();
                return reduce(node.Rest(),function(last,now){
                    return last-now;
                },r);
			},
            "*":function(node){
                return reduce(node,function(last,now){
                    return last*now;
                },1);
            },
            "/":function(node){
                var r=node.First();
                return reduce(node.Rest(),function(last,now){
                    return last/now;
                },r);
            },
            ">":function(node){
                //数字
                return compare(node,function(last,now){
                    return (last>now);
                });
            },
            "<":function(node){
                //数字
                return compare(node,function(last,now){
                    return (last<now);
                });
            },
            "=":function(node){
                //可用于数字，字符串
                return compare(node,function(last,now){
                    return (last==now);
                });
            },
            and:function(node){
                return reduce(node,function(init,v) {
                    return and(init,v);
                },true);
            },
            or:function(node){
                return reduce(node,function(init,v) {
                    return or(init,v);
                },false);
            },
            not:function(node){
                return !node.First();
            },
            apply:function(node) {
                var run=node.First();
                node=node.Rest();
                var args=node.First();
                return run.exec(args);
            },
            "js-eval":function(node){
                return eval(node.First());
            },
            /*
            *o k (ps)
            */
            "js-call":function(node){
                var o=node.First();
                if(typeof(o)=='string'){
                    o=eval(o);
                }
                node=node.Rest();
                var n=node.First();
                var ps=[];
                var as=[];
                node=node.Rest();
                if(node){
                    ps=lib.s.array_from_list(node.First());
                    for(var i=0;i<ps.length;i++){
                        as.push("ps["+i+"]");
                    }
                }
                var str="o[n]("+as.join(",")+")";
                //mb.log(ps);
                return eval(str);
            },
            "js-attr":function(node){
                var o=node.First();
                if(typeof(o)=='string'){
                    o=eval(o);
                }
                node=node.Rest();
                var n=node.First();
                node=node.Rest();
                if(node){
                    //设置值
                    o[n]=node.First();
                }else{
                    //取值
                    return o[n];
                }
            }
		};
        var core=lib.s.kvs_from_map(
            mb.Object.map(
                library,
                function(v,k){
                    if(typeof(v)=='function'){
                        return lib.interpret.buildLibFun(k,v);
                    }else{
                        return v;
                    }
                }
            )
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
            exec:function(node){
                if(node==null){
                    return this.v;
                }else{
                    this.v=node.First();
                }
            }
        });
        core=lib.s.kvs_extend(
            "cache",
            lib.interpret.buildLibFun(
                "cache",
                function(node) {
                    var v=node.First();
                    return new Cache(v);
                }
            ),
            core
        );
        return core;
	}
})