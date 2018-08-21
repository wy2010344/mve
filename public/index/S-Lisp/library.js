({
	data:{
		util:"./util.js"
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
					cs.push(lib.util.log(t.First()));
				}
				log(cs);
			},
            reverse:function(node){
                var v=node.First();
                return lib.util.reverse(node.First());
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
            "list?":function(node){
                var f=node.First();
                return (f && f.isList);
            },
            "function?":function(node){
                var f=node.First();
                return (f && f.isFun);
            },
            length:function(node){
                return node.First().Length();
            },
            extend:function(node){
            	return lib.util.extend(node.First(),node.Rest().First());
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
                return lib.util.kvs_find1st(kvs,key);
            },
            "kvs-extend":function(node) {
                var key=node.First();
                node=node.Rest();
                var value=node.First();
                node=node.Rest();
                var kvs=node.First();
                return lib.util.kvs_extend(key,value,kvs);
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
            toString:function(node){
                return node.First().toString(true);  
            },
            stringify:function(node){
                //类似于JSON.stringify，没想好用toString还是stringify;
                return node.First().toString(true);  
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
            "js-eval":function(node){
                return eval(node.First());
            },
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
                    ps=lib.util.array_from_list(node.First());
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

        return function(libfun,apply) {
            var core=lib.util.kvs_from_map(
                mb.Object.map(
                    library,
                    function(v,k){
                        if(typeof(v)=='function'){
                            return libfun(k,v);
                        }else{
                            return v;
                        }
                    }
                )
            );
            var Cache=function(v) {
                this.v=v;
            }
            Cache.prototype=new libfun.Fun();
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
            core=lib.util.kvs_extend(
                "cache",
                libfun(
                    "cache",
                    function(node) {
                        var v=node.First();
                        return new Cache(v);
                    }
                ),
                core
            );
            core=lib.util.kvs_extend(
                "apply",
                apply,
                core
            );
            return core;
        };
	}
})