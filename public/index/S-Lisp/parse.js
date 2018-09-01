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
		var extend=lib.s.extend;
		var reverse=lib.s.reverse;

		function Exp(type,token) {
			this.token=token;
			this.type=type;
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
		var parse=function(tokens,Node) {
			var caches=extend({
				token:{
					type:"BraR",
					value:"}",
					loc:{
						row:0,
						col:0
					}
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
								e=new Exp("id",x);
							}else
							if(x.type=="id"){
								e=new Exp("string",x);
							}
						}else{
							if(x.type=="quote"){
								e=new Exp("string",x);
							}else
							if(x.type=="id"){
								e=new Exp("id",x);
							}
						}
					}
					if(e){
						children=extend(e,children);
					}else{
						if(x.type!="comment"){
							throw "出错"+x.type+":"+x.value+":"+JSON.stringify(x.loc);
						}
					}
				}
			}
			return new BracketsExp("{}",null,children,null);
		};
		return parse;
	}
})