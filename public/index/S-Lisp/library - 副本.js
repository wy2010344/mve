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
        var reduce=function(args,func,init) {
            for(var t=args;t!=null;t=t.Rest()){
                init=func(init,t.First());
            }
            return init;
        };
        var compare=function(args,check,func){
            var last=args.First();
            var init=true;
            check(last);
            //mb.log(args.toString())
            for(var t=args.Rest();t!=null;t=t.Rest()){
                var now=t.First();
                check(now);
                init=and(init,func(last,now));
                last=now;
            }
            return init;
        };
        var check_is_number=function(s){
            if(s==0){
                return true;
            }else
            if(s && s.constructor==Number){
                return true;
            }else{
                mb.log(s+"不是合法的数字类型"+s.constructor);
                return false;
            }
        };
        var kvs_path=function(kvs,paths){
            var value=null;
            while(paths!=null){
                var path=paths.First();
                value=lib.s.kvs_find1st(kvs,path);
                paths=paths.Rest();
                kvs=value;
            }
            return value;
        };
        var eq=function(args,check){
            //可用于数字，字符串，实体
            return compare(args,check,function(last,now){
                return (last==now);
            });
        };

        
		var library={
            "false":false,
            "true":true,
            first:function(args){
                var v=args.First();
                return v.First();
            },
            rest:function(args){
                var v=args.First();
                return v.Rest();
            },
            extend:function(args){
                return lib.s.extend(args.First(),args.Rest().First());
            },
            length:function(args){
                return args.First().Length();
            },
            "+":function(args){
                return reduce(args,function(last,now){
                    return last+now;
                },0);
            },
            "-":function(args){
                var r=args.First();
                return reduce(args.Rest(),function(last,now){
                    return last-now;
                },r);
            },
            "*":function(args){
                return reduce(args,function(last,now){
                    return last*now;
                },1);
            },
            "/":function(args){
                var r=args.First();
                return reduce(args.Rest(),function(last,now){
                    return last/now;
                },r);
            },
            "parseInt":function(args){
                return parseInt(args.First());
            },
            ">":function(args){
                //数字
                return compare(args,check_is_number,function(last,now){
                    return (last>now);
                });
            },
            "<":function(args){
                //数字
                return compare(args,check_is_number,function(last,now){
                    return (last<now);
                });
            },
            "=":function(args){
                return eq(args,check_is_number);
            },
            and:function(args){
                return reduce(args,function(init,v) {
                    return and(init,v);
                },true);
            },
            or:function(args){
                return reduce(args,function(init,v) {
                    return or(init,v);
                },false);
            },
            not:function(args){
                return !args.First();
            },
            "empty?":function(args){
                return (args.First()==null);
            },
            "exist?":function(args) {
                return (args.First()!=null);
            },
			log:function(args){
				var cs=[];
				for(var t=args;t!=null;t=t.Rest()){
					cs.push(lib.s.log(t.First()));
				}
				log(cs);
			},
            //a?b:default(null)
            "if":function(args){
                if(args.First()==true){
                    return args.Rest().First();
                }else{
                    args=args.Rest().Rest();
                    if(args){
                        return args.First();
                    }else{
                        return null;
                    }
                }
            },
            eq:function(args){
                return eq(args,function(){return true;});
            },
            apply:function(args) {
                var run=args.First();
                args=args.Rest();
                var args=args.First();
                return run.exec(args);
            },
            stringify:function(args){
                //类似于JSON.stringify，没想好用toString还是stringify;
                return args.First().toString();  
            },
            type:function(args) {
                var n=args.First();
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
            "str-eq":function(args){
                return eq(args,function(s){
                    if(s && s.constructor==String){
                        return true;
                    }else{
                        return false;
                    }
                });
            },
            "str-length":function(args) {
                var str=args.First();
                return str.length;
            },
            "str-charAt":function(args){
                var str=args.First();
                args=args.Rest();
                var index=args.First();
                return str.charAt(index);
            },
            "str-join":function(args){
                //字符串
                var array=args.First();
                var split="";
                if(args.Rest()!=null){
                    split=args.Rest().First();
                }
                var r="";
                for(var t=array;t!=null;t=t.Rest()){
                    r=r+t.First()+split;
                }
                return r.substr(0,r.length-split.length);
            },
            "str-trim":function(args) {
                var str=args.First();
                return str.trim();
            },
            "str-startsWith":function(args) {
                var str=args.First();
                args=args.Rest();
                var v=args.First();
                return str.startsWith(v);
            },
            "str-endsWith":function(args) {
                var str=args.First();
                args=args.Rest();
                var v=args.First();
                return str.endsWith(v);
            },
            "str-indexOf":function(args) {
                var str=args.First();
                args=args.Rest();
                var v=args.First();
                return str.indexOf(v);
            },
            "str-lastIndexOf":function(args) {
                var str=args.First();
                args=args.Rest();
                var v=args.First();
                return str.lastIndexOf(v);
            },
            "str-split":function(args){
                var str=args.First();
                args=args.Rest();
                var split=args.First();
                var array=str.split(split);
                var r=null;
                for(var i=array.length-1;i>-1;i--){
                    r=lib.s.extend(array[i],r);
                }
                return r;
            },
            "str-upper":function(args){
                return args.First().toUpperCase();
            },
            "str-lower":function(args){
                return args.First().toLowerCase();
            },


            
            quote:function(args){
                return args.First();
            },
            /*主要用于用闭包构建参数*/
            list:function(args){
                return args;
            },
            call:function(args){
                var run=args.First();
                args=args.Rest();
                return run.exec(args);
            },
            reverse:function(args){
                var v=args.First();
                return lib.s.reverse(v);
            },
            "kvs-find1st":function(args){
                var kvs=args.First();
                args=args.Rest();
                var key=args.First();
                return lib.s.kvs_find1st(kvs,key);
            },
            "kvs-extend":function(args) {
                var key=args.First();
                args=args.Rest();
                var value=args.First();
                args=args.Rest();
                var kvs=args.First();
                return lib.s.kvs_extend(key,value,kvs);
            },
            "kvs-path":function(args){
                var kvs=args.First();
                args=args.Rest();
                var paths=args.First();
                return kvs_path(kvs,paths);
            },
            "kvs-path-run":function(args){
                var kvs=args.First();
                args=args.Rest();
                var paths=args.First();
                args=args.Rest();
                return kvs_path(kvs,paths).exec(args);
            },
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