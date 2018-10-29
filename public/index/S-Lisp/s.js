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
			_toString_:function(v){
				if(v==null){
					return "[]";
				}else
				if(v.isList){
					return v.toString();
				}else
				if(typeof(v)=="string"){
					return string_to_trans(v,'"','"');
				}else
				if(v.isFun){
					if(v.ftype()==v.Function_type.lib)
					{
						return "'"+v.toString();
					}else
					if(v.ftype()==v.Function_type.cache){
						return "[]";
					}else{
						return v.toString();
					}
				}else
				if(typeof(v)=="bool"){
					return v.toString();
				}else
				if(typeof(v)=="number"){
					return v.toString();
				}else{
					var vx=v.toString();
					if(vx!=null){
						return "'"+vx;
					}else{
						return "[]";
					}
				}
			},
			toString:function(bool) {
				var v=this._toString_(this.First());
				var t=this.Rest();
				while(t!=null){
					v=v+" "+this._toString_(t.First());
					t=t.Rest();
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

		/*Token*/
		function Token(type,value,old_value,loc) {
			this.type=type;
			this.value=value;
			this.old_value=old_value;
			this.loc=loc;
		};
		mb.Object.ember(Token.prototype,{
			toString:function() {
				return this.old_value;
			}
		});

		function LocationException(msg,loc){
			this.msg=msg;
			this.loc=loc;
			this.stacks=[];
		}
		mb.Object.ember(LocationException.prototype,{
			isLocationException:true,
			addStack:function(path,left,right,exp){
				this.stacks.push({
					path:path,
					left:left,
					right:right,
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
			toString:function(o,trans){
				if(o==null){
					return "[]";
				}else
				if(trans){
					if(typeof(o)=="string"){
						return string_to_trans(o,'"','"');
					}else{
						return o.toString();
					}
				}else{
					return o.toString();
				}
			},
			Token:function(type,value,old_value,loc){
				return new Token(type,value,old_value,loc);
			},
			Location:function(row,col,i){
				return new Location(row,col,i);
			},
			LocationException:function(msg,loc){
				return new LocationException(msg,loc);
			},
			isInt:function(s) {
				var ret=true;
				var i=0;
				if(s[i]=='-'){
					i==1;
				}
				while(i<s.length){
					var c=s[i];
					ret=(ret && '0'<=c && c<='9'); 
					i++;
				}
				return ret;
			},
			isFloat:function(s) {
				var ret=true;
				var i=0;
				if(s[i]=='-'){
					i==1;
				}
				var noPoint=true;
				while(i<s.length){
					var c=s[i];
					if(c=='.'){
						if(noPoint){
							noPoint=false;
						}else{
							//重复出现小数点
							ret=ret && false;
						}
					}else
					{
						ret=(ret && '0'<=c && c<= '9');
					}
					i++;
				}
				return ret;
			},
			string_to_trans:string_to_trans,
			kvs_extend:kvs_extend,
			kvs_find1st:kvs_find1st,
			extend:extend,
			list:function(){
				var r=null;
				for(var i=arguments.length-1;i>-1;i--){
					r=extend(arguments[i],r);
				}
				return r;
			},
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