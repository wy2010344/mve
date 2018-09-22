({
	delay:true,
	success:function(){
		var string_to_trans=function(str,start,end,trans_map) {
			var s=start;
			var i=0;
			var len=str.length;
			while(i<len){
				var c=str[i];
				if(c=="\\"){
					s=s+"\\\\";
				}else
				if(c==end){
					s=s+"\\"+end;
				}else{
					if (trans_map) {
						var x=trans_map[c];
						if(x){
							s=s+"\\"+x;
						}else{
							s=s+c;
						}
					}else{
						s=s+c;
					}
				}
				i++;
			}
			s=s+end;
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
					v=string_to_trans(v,'"','"');
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

		function Location(row,col,i){
			this.row=row;
			this.col=col;
			this.i=i;
		}

		mb.Object.ember(Location.prototype,{
			isLocation:true,
			toString:function(){
				return "在位置{行:"+(this.row+1)+",列:"+(this.col+1)+",第"+(this.i+1)+"个字符}";
			}
		});

		function LocationException(msg,loc){
			this.msg=msg;
			this.loc=loc;
			this.stacks=[];
		}
		mb.Object.ember(LocationException.prototype,{
			isLocationException:true,
			addStack:function(path,loc,exp){
				this.stacks.push({
					path:path,
					loc:loc,
					exp:exp
				});
			},
			toString:function(){
				var err="";
				mb.Array.forEach(this.stacks,function(stack,i){
					err=stack.path+":\t"+stack.loc.toString()+":\t"+stack.exp+"\r\n";
				});
				err=err+this.loc.toString()+":\t"+this.msg;
				return err;
			}
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
		var me={
			Node:Node,
			log:function(o){
				if(o==null){
					return "[]";
				}else
				if(typeof(o)=="string"){
					return string_to_trans(o,'"','"');
				}else{
					return o.toString();
				}
			},
			Location:function(row,col,i){
				return new Location(row,col,i);
			},
			LocationException:function(msg,loc){
				return new LocationException(msg,loc);
			},
			string_to_trans:string_to_trans,
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