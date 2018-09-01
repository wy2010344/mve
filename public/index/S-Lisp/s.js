({
	delay:true,
	success:function(){

		var trans={
			"\r":"\\r",
			"\n":"\\n",
			"\t":"\\t",
			"\\":"\\\\",
			"\"":"\\\""
		};
		var escape_str=function(str){
			var s="\"";
			var i=0;
			while(i<str.length){
				var c=str.charAt(i);
				var x=trans[c];
				if(x!=null){
					s=s+x;
				}else{
					s=s+c;
				}
				i++;
			}
			s=s+"\"";
			return s;
		};
		function Node(v,vs){
			this.v=v;
			this.vs=vs;
			this.length=1;
			if(vs!=null){
				this.length=this.length+vs.length;
			}
		};
		mb.Object.ember(Node.prototype,{
			First:function() {
				return this.v;
			},
			Rest:function() {
				return this.vs;
			},
			Length:function(){
				return this.length;
			},
			toString:function(bool) {
				var v=this.First();
				if(v==null){
					v="[]";
				}else
				if(v.isFun){
					//内置库转义
					if(v.ftype()==v.Function_type.lib){
						v="'"+v;
					}
				}else
				if(typeof(v)=="string"){
					//字符串
					v=escape_str(v);
				}else{
					//其它类型
					v=v.toString();
				}

				if(this.Rest()){
					v=v+" "+this.Rest().toString(true);
				}
				if(bool){
					return v;
				}else{
					return "["+v+"]";
				}
			},
			isList:true
		});
		var extend=function(v,vs){
			return new Node(v,vs);
		};
		var kvs_extend=function(key,value,kvs){
			return extend(key,extend(value,kvs));
		};
        /*
        递归调用可能超过最大堆栈
        */
        var kvs_find1st=function(kvs,key){
        	var t=kvs;
        	var r=null;
        	var will=true;
        	while(t!=null && will){
        		var t_k=t.First();
        		t=t.Rest();
        		var t_v=t.First();
        		t=t.Rest();
        		if(t_k==key){
        			r=t_v;
        			will=false;
        		}
        	}
        	return r;
		};
		var list_from_array=function(array) {
			var i=0;
			var r=null;
			while(i<array.length){
				r=new Node(array[i],r);
				i++;
			}
			return r;
		};
		/*
		*从s-lisp转成js-array
		*/
		var array_from_list=function(node) {
			var r=[];
			var t=node;
			while(t!=null){
				var v=t.First();
				if(v==null){
					r.push(null);
				}else
				if(v.isFun){
					r.push(fun_from_list(v));
				}else
				if(v.isList){
					r.push(array_from_list(v));
				}else{
					r.push(v);
				}
				t=t.Rest();
			}
			return r;
		};
		/*
		*从s-lisp转成js-function
		*/
		var fun_from_list=function(fun){	
			return function() {
				var args=list_from_array(arguments);
				return fun.exec(args);
			};
		};

		var Fun=new Function();
		Fun.prototype.isFun=true;
        Fun.prototype.Function_type={
            lib:0,
            user:1,
            cache:2
        };

        function LibFun(key,fun) {
            this.fun=fun;
            this.key=key;
        }
        LibFun.prototype=new Fun();
        mb.Object.ember(LibFun.prototype,{
            toString:function() {
                return this.key;
            },
            ftype:function() {
                return this.Function_type.lib;
            },
            exec:function(node) {
                try{
                    return this.fun(node);
                }catch(e){
                    mb.log(e,node.toString(),this.fun.toString());
                    return null;
                }
            }
        });
		var me={
			Node:Node,
			Fun:Fun,
			LibFun,LibFun,
			buildLibFun:function(k,fun) {
				return new LibFun(k,fun);
			},
			log:function(o){
				if(o==null){
					return "[]";
				}else
				if(typeof(o)=="string"){
					return escape_str(o);
				}else{
					return o.toString();
				}
			},
			kvs_extend:kvs_extend,
			kvs_find1st:kvs_find1st,
			extend:extend,
			list_from_array:list_from_array,
			array_from_list:array_from_list,
			kvs_from_map:function(map){
				var kvs=null;
				mb.Object.forEach(map,function(v,k){
					kvs=kvs_extend(k,v,kvs);
				});
				return kvs;
			},
			map_from_kvs:function(kvs){
				var map={};
				var n=kvs;
				while(n!=null){
					var k=n.First();
					n=n.Rest();
					var v=n.First();
					n=n.Rest();
					if(v==null){
						map[k]=null;
					}else
					if(v.isFun){
						map[k]=fun_from_list(v);
					}else
					if(v.isList){
						map[k]=array_from_list(v);
					}else{
						map[k]=v;
					}
				}
				return map;
			},
			reverse:function(node){
				var r=null;
				for(var t=node;t!=null;t=t.Rest()){
					r=extend(t.First(),r);
				}
				return r;
			}
		};

		return me;
	}
});