({
	data:{
		interpret:"../interpret.js",
		util:"./util.js"
	},
	delay:true,
	success:function() {
		var util=lib.interpret.util;
		var buildLet=function(node,scope) {
			var i=1;
			while(i<node.children.length){
				var c=node.children[i];
				i++;
				var v_r=node.children[i];
				i++;
				var v=interpret(v_r,scope);

				scope=lib.interpret.buildMatch(scope,c,v,buildLibFun);
			}
			return scope;
		};

		var runQueue=function(scope) {
			return function(c) {
				if(c.type=="()"){
					var c1=c.children[0];
					if(c1 && c1.type=="id" && c1.value=="let"){
						scope=buildLet(c,scope);
						return null;
					}else{
						return interpret(c,scope);
					}
				}else{
					return interpret(c,scope);
				}
			}
		};


		var UserFun=function(input,parentScope) {
			this.input=input;
			this.parentScope=parentScope;
		};
		UserFun.prototype=new lib.util.Fun();
		mb.Object.ember(UserFun.prototype,{
			toString:function() {
				return this.input.toString();
			},
			clone:function() {
				return new UserFun(this.input,this.parentScope);
			},
			exec:function(node){
				var scope=util.kvs_extend("args",node,this.parentScope);
				scope=util.kvs_extend("this",this,scope);
				var rq=runQueue(scope);
				var r=null;
				mb.Array.forEach(this.input.children,function(c,i) {
					r=rq(c);
				});
				return r;
			},
			ftype:function() {
				return this.Function_type.user;
			}
		});

		var buildFunc=function(input,parentScope) {
			return new UserFun(input,parentScope);
		};
		var buildLibFun=function(k,fun) {
			return new lib.util.LibFun(k,fun);
		};
		buildLibFun.Fun=lib.util.Fun;

		var calNodes=function(node,scope) {
			var r=null;
			mb.Array.forEach(node.children,function(c,i) {
				r=util.extend(interpret(c,scope),r);
			});
			return util.reverse(r);
		};

		var interpret=function(input,scope) {
			if(input.type=="()"){
				var nodes=calNodes(input,scope);
				var first=nodes.First();
				var first=nodes.First();
				if(first && first.isFun){
					return first.exec(nodes.Rest());
				}else{
					var key=input.children[0].value;
					mb.log(key,util.kvs_find1st(scope,key),nodes.toString(true),input.toString(true))
					throw "参数0必须为函数";
				}
			}else
			if (input.type=="[]") {
				return calNodes(input,scope);
			}else
			if(input.type=="{}"){
				return buildFunc(input,scope);
			}else
			if(input.type=="id"){
				return util.kvs_find1st(scope,input.value);
			}else{
				return input.value;
			}
		};

		return {
			buildFunc:buildFunc,
			buildLibFun:buildLibFun,
			runQueue:runQueue,
			util:util
		}
	}
});