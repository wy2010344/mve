({
	data:{
		s:"./s.js"
	},
	delay:true,
	success:function() {
		var kvs_quote=[
			"(",")",
			"[","]",
			"{","}"
		];
		var quoteLeftToRight=function(left) {
			var i=0;
			var right=null;
			while(i<kvs_quote.length&&right==null){
				var t_l=kvs_quote[i];
				i++;
				var t_r=kvs_quote[i];
				i++;
				if(t_l==left){
					right=t_r;
				}
			}
			return right;
		};
		var extend=function(x,xs){
			return lib.s.extend(x,xs)
		};
		var reverse=function(xs){
			return lib.s.reverse(xs);
		};

		function Exp(type,token) {
			this.token=token;
			this.type=type;
		};
		mb.Object.ember(Exp.prototype,{
			toString:function() {
				return this.token.toString();
			},
			exception:function(msg){
				return lib.s.LocationException(msg,this.token.loc);
			}
		});
		function BracketsExp(type,left,children,right,r_children) {
			this.type=type;
			this.left=left;
			this.children=children;
			this.right=right;
			this.r_children=r_children;
		};
		mb.Object.ember(BracketsExp.prototype,{
			toString:function() {
				//true是因为children是列表类型，要去列表，留下内部
				var v=this.left.toString();
				for(var t=this.children;t!=null;t=t.Rest()){
					v=v+t.First().toString()+" ";
				}
				return v+this.right.toString();
			},
			exception:function(msg){
				return lib.s.LocationException(msg,this.left.loc);
			}
		});
		function IDExp(token) {
			this.type="id";
			this.token=token;
			var id=token.value;
			if(id[0]=='.' || id[id.length-1]=='.'){
				this.paths=null;
			}else{
				var r=null;
				var i=0;
				var last_i=0;
				var has_error=false;
				while(i<id.length){
					var c=id[i];
					if(c=='.'){
						var node=id.substr(last_i,i-last_i);
						last_i=i+1;
						if(node==""){
							has_error=true;
						}else{
							r=lib.s.extend(node,r);
						}
					}
					i++;
				}
				r=lib.s.extend(id.substr(last_i),r);
				if(has_error){
					throw lib.s.LocationException(id+"不是合法的ID，不允许.连续存在",token.loc);
				}else{
					this.paths=lib.s.reverse(r);
				}
			}
		}
		mb.Object.ember(IDExp.prototype,{
			toString:function() {
				return this.token.toString();
			},
			exception:function(msg){
				return lib.s.LocationException(msg,this.token.loc);
			}
		});
		var resetLetID=function(k){
			if(k.token.value.indexOf('.')<0){
				return new Exp("let-id",k.token);
			}else{
				throw lib.s.LocationException("let表达式中，"+k.toString()+"不是合法的key-id类型",k.loc);
			}
		};
		var resetLetSmall=function(small){
			var vs=small.r_children;
			var children=null;
			if(vs!=null){
				var k=vs.First();
				vs=vs.Rest();
				if(k.type=="id"){
					var v=k.token.value;
					if(v.startsWith("...")){
						v=v.substr(3);
						if(v.indexOf('.')<0){
							k.token.value=v;
							children=extend(
								new Exp(
									"let-...",
									k.token
								),
								children
							);
						}else{
							throw lib.s.LocationException("let表达式中，不合法的剩余匹配:"+k.toString(),k.loc);
						}
					}else{
						children=extend(resetLetID(k),children);
					}
				}
			}
			while(vs!=null){
				var k=vs.First();
				vs=vs.Rest();
				if(k.type=="()"){
					children=extend(resetLetSmall(k),children);
				}else
				if(k.type=="id"){
					children=extend(resetLetID(k),children);
				}
			}
			return new BracketsExp(
				"let-()",
				small.left,
				children,
				small.right,
				null
			);
		};
		var resetLetKV=function(vks){
			var children=null;
			while(vks!=null){
				var v=vks.First();
				children=extend(v,children);
				vks=vks.Rest();
				if(vks!=null){
					var k=vks.First();
					vks=vks.Rest();
					if(k.type=="id"){
						children=extend(resetLetID(k),children);
					}else
					if(k.type=="()"){
						if(k.children==null){
							//mb.log("Let表达式中无意义的空()，请检查" + k.loc.toString() + ":" + v.toString());
						}
						children=extend(resetLetSmall(k),children);
					}else{
						throw lib.s.LocationException("let表达式中，不合法的key类型:" + k.ToString(),k.loc);
					}
				}
			}
			return children;
		};
		var check_Large=function(vs){
			while(vs!=null){
				var v=vs.First();
				vs=vs.Rest();
				if(vs!=null){
					var t=v.type;
					if(!(t=="let" || t=="()" || t=="[]")){
						//mb.log("warn:函数中定义无意义的表达式，请检查"+v.loc.toString()+":"+v.toString());
					}
				}
			}
		};
		var parse=function(tokens,Node) {
			var root_loc=lib.s.Location(0,0,0);
			var root_left=lib.s.Token("BraL","{","{",root_loc);
			var root_right=lib.s.Token("BraR","}","}",root_loc);

			var caches=extend({
				right:root_right,
				type:"{}"
			},null);
			var children=null;
			var xs=tokens;
			while(xs!=null){
				var x=xs.First();
				xs=xs.Rest();
				if(x.type=="BraR"){
					var v="";
					if(x.value==")"){
						v="()";
					}else
					if(x.value=="]"){
						v="[]";
					}else
					if(x.value=="}"){
						v="{}";
					}
					caches=extend({
						right:x,
						type:v,
						children:children
					},caches);
					children=null;
				}else
				if(x.type=="BraL"){
					var cache=caches.First();
					var c_right=cache.right.value;
					var right=quoteLeftToRight(x.value);
					if(c_right==right){
						var r_children=null;
						var tp=cache.type;
						if(tp=="{}"){
							check_Large(children);
						}else{
							r_children=lib.s.reverse(children);
						}
						var caches_parent=caches.Rest();
						if(caches_parent!=null){
							var p_exp=caches_parent.First();
							if(p_exp.type=="{}"){
								if(tp=="()"){
									if(children==null){
										throw lib.s.LocationException("不允许空的()",x.loc);
									}else{
										var first=children.First();
										if(first.type=="id" && first.token.value=="let"){
											tp="let";
											if(children.Length()==1){
												throw lib.s.LocationException("不允许空的let表达式",first.loc);
											}else{
												children=extend(children.First(),resetLetKV(lib.s.reverse(children.Rest())));
											}
										}else{
											if(!(first.type=="id" || first.type=="{}" || first.type=="()")){
												throw lib.s.LocationException("函数调用第一个应该是id或{}或()，而不是" + first.ToString(),first.loc);
											}
										}
									}
								}
							}
						}

						children=extend(
							new BracketsExp(
								tp,
								x,
								children,
								cache.right,
								r_children
							),
							cache.children
						);
						caches=caches.Rest();
					}else{
						throw lib.s.LocationException("括号不对称",x.loc);
					}
				}else{
					var e=null;/*一定要重置为null，否则要出问题*/
					var cache=caches.First();
					if(x.type=="string"){
						e=new Exp("string",x);
					}else
					if(x.type=="int"){
						e=new Exp("int",x);
					}else
					/*
					if(x.type=="float"){
						e=new Exp("float",x);
					}else
					*/
					if(x.type=="bool"){
						e=new Exp("bool",x);
					}else{
						if("]"==cache.right.value){
							if(x.type=="quote"){
								if(x.value=="true"||x.value=="false"|| lib.s.isInt(x.value)){
									throw lib.s.LocationException("中括号内转义寻找作用域上的" + x.value+ "定义",x.loc);
								}
								e=new IDExp(x);
							}else
							if(x.type=="id"){
								e=new Exp("string",x);
							}
						}else{
							if(x.type=="quote"){
								e=new Exp("string",x);
							}else
							if(x.type=="id"){
								e=new IDExp(x);
							}
						}
					}
					if(e){
						children=extend(e,children);
					}else{
						if(x.type!="comment"){
							throw "出错"+x.type+":"+x.value+":"+x.loc.toString();
						}
					}
				}
			}
			check_Large(children);
			return new BracketsExp("{}",root_left,children,root_right);
		};
		return parse;
	}
})