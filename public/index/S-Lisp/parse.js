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
			this.loc=token.loc;
			this.value=token.value;
		};
		mb.Object.ember(Exp.prototype,{
			toString:function() {
				return this.token.toString();
			}
		});
		function BracketsExp(type,left,children,right,r_children) {
			this.type=type;
			this.left=left;
			if(left){
				this.loc=left.loc;
			}else{
				this.loc=lib.s.Location(0,0,0);
			}
			this.children=children;
			this.right=right;
			this.r_children=r_children;
		};
		mb.Object.ember(BracketsExp.prototype,{
			toString:function() {
				//true是因为children是列表类型，要去列表，留下内部
				if(this.children){
					return this.type[0]+this.children.toString(true)+this.type[1];
				}else{
					return this.type;
				}
			}
		});
		function IDExp(token) {
			this.type="id";
			this.token=token;
			var id=token.value;
			this.value=id;
			this.loc=token.loc;
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
					throw id+"不是合法的ID，不允许.连续存在";
				}else{
					this.paths=lib.s.reverse(r);
				}
			}
		}
		mb.Object.ember(IDExp.prototype,{
			toString:function() {
				return this.value;
			}
		});
		var parse=function(tokens,Node) {
			var caches=extend({
				token:{
					type:"BraR",
					value:"}",
					loc:lib.s.Location(0,0,0)
				},
				children:null
			},null);
			var children=null;
			var xs=tokens;
			while(xs!=null){
				var x=xs.First();
				xs=xs.Rest();
				if(x.type=="BraR"){
					caches=extend(
						{
							token:x,
							children:children
						},
						caches
					);
					children=null;
				}else
				if(x.type=="BraL"){
					var cache=caches.First();
					var c_right=cache.token.value;
					var right=quoteLeftToRight(x.value);
					if(c_right==right){
						var e;
						if("}"==c_right){
							e=new BracketsExp(
								"{}",
								x,
								children,
								cache.token
							);
						}else
						if("]"==c_right){
							e=new BracketsExp(
								"[]",
								x,
								children,
								cache.token,
								reverse(children)
							);
						}else
						if(")"==c_right){
							e=new BracketsExp(
								"()",
								x,
								children,
								cache.token,
								reverse(children)
							);
						}
						caches=caches.Rest();
						children=extend(e,cache.children);
					}else{
						var msg="括号不对称";
						throw msg;
					}
				}else{
					var e;
					var cache=caches.First();
					if(x.type=="string"){
						e=new Exp("string",x);
					}else
					if(x.type=="int"){
						e=new Exp("int",x);
					}else{
						if("]"==cache.token.value){
							if(x.type=="quote"){
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
			return new BracketsExp("{}",null,children,null);
		};
		return parse;
	}
})