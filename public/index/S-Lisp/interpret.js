({
	data:{
		s:"./s.js"
	},
	delay:true,
	success:function() {
		var isID=function(str){
			var ret=true;
			for(var i=0;i<str.length;i++){
				var c=str[i];
				if(c==' ' || c=='\t' || c=='\n' || c=='\r'){
					ret=false;
				}else
				if(c=='*'||c=='\''){ // || c=='.' 
					ret=false;
				}
			}
			return ret;
		};
		var buildKVSMatch=function(scope,x,kvs){
			x=x.substr(0,x.length-1);
			if(isID(x)){
				scope=lib.s.kvs_extend(
					x,
					new LibFun("kvs-match",function(node){
						return lib.s.kvs_find1st(kvs,node.First());
					}),
					scope
				);
				/*由于可能重复定义，必须倒转，倒转后是v-k-v-k的形式*/
				for(var t=lib.s.reverse(kvs);t!=null;t=t.Rest()){
					var v=t.First();
					t=t.Rest();
					if(t==null){
						throw "过早结束"+n;
					}else{
						var k=t.First();
						if(isID(k)){
							scope=lib.s.kvs_extend(x+"."+k,v,scope);
						}else{
							//忽略
						}
					}
				}
			}else{
				throw x+"不是合法的ID2";
			}
			return scope;
		};
		var buildKVSMatch=function() {
			throw "为了雪藏的kvs-match，暂时不允许以*号结尾";
		};
		var buildBracket=function(cs,vs,scope){
			while(cs!=null){
				var c=cs.First();
				if(cs.Rest()==null && c.value.startsWith("...")){
					//最后的省略号
					var k=c.value.slice(3);
					if(k.endsWith("*")){
						scope=buildKVSMatch(scope,k,kvs);
					}else{
						scope=buildNormal(scope,k,vs);
					}
				}else{
					var v=null;//一定要赋值啊
					if(vs!=null){
						v=vs.First();
						vs=vs.Rest();
					}
					scope=buildMatch(scope,c,v);
				}
				cs=cs.Rest();
			}
			return scope;
		};
		var buildNormal=function(scope,k,v) {
			if(isID(k)){
				scope=lib.s.kvs_extend(k,v,scope);
			}else{
				throw k+"不是合法的ID1";
			}
			return scope;
		};
		var buildMatch=function(scope,c,v) {
			if(c.type=="()"){
				scope=buildBracket(c.children,v,scope);
			}else
			if(c.type=="id"){
				if(c.value.endsWith("*")){
					scope=buildKVSMatch(scope,c.value,v);
				}else{
					scope=buildNormal(scope,c.value,v);
				}
			}else{
				throw c.toString()+"不是合法的ID类型";
			}
			return scope;
		};
		var buildLet=function(kvs,scope) {
			while(kvs!=null){
				var k=kvs.First();
				kvs=kvs.Rest();
				var v_r=kvs.First();
				kvs=kvs.Rest();
				var v=interpret(v_r,scope);
				scope=buildMatch(scope,k,v);
			}
			return scope;
		};


		var calNodes=function(children,scope) {
			var r=null;
			while(children!=null){
				var child=children.First();
				r=lib.s.extend(interpret(child,scope),r);
				children=children.Rest();
			}
			return r;
			//return lib.s.reverse(r);
		};
		var interpret=function(input,scope) {
			if(input.type=="()"){
				var nodes=calNodes(input.r_children,scope);
				var first=nodes.First();
				if(first && first.isFun){
					return first.exec(nodes.Rest());
				}else{
					var key=input.children.First().value;
					var sv=input.toString(true);
					var nv=nodes.toString(true);
					mb.log(key,first,nv,sv);
					throw "参数0必须为函数"+nv+":"+sv;
				}
			}else
			if (input.type=="[]") {
				return calNodes(input.r_children,scope);
			}else
			if(input.type=="{}"){
				return new UserFun(input,scope);
			}else
			if(input.type=="id"){
				return lib.s.kvs_find1st(scope,input.value);
			}else{
				return input.value;
			}
		};

		var runQueue=function(scope) {
			return function(exps) {
				var r=null;
				while(exps!=null){
					var exp=exps.First();
					if(exp.type=="()"){
						var c1=exp.children.First();
						if(c1 && c1.type=="id" && c1.value=="let"){
							scope=buildLet(exp.children.Rest(),scope);
							r=null;
						}else{
							r=interpret(exp,scope);
						}
					}else{
						r=interpret(exp,scope);
					}
					exps=exps.Rest();
				}
				return r;
			}
		};

		/*基础函数*/
		var Fun=new Function();
		Fun.prototype.isFun=true;
        Fun.prototype.Function_type={
            lib:0,
            user:1,
            cache:2
        };

        /*库函数*/
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



		/*用户自定义函数*/
		var UserFun=function(input,parentScope) {
			this.input=input;
			this.parentScope=parentScope;
		};
		UserFun.prototype=new Fun();
		mb.Object.ember(UserFun.prototype,{
			toString:function() {
				return this.input.toString();
			},
			exec:function(node){
				var scope=lib.s.kvs_extend("args",node,this.parentScope);
				scope=lib.s.kvs_extend("this",this,scope);
				var rq=runQueue(scope);
				return rq(this.input.children);
			},
			ftype:function() {
				return this.Function_type.user;
			}
		});
		return {
			runQueue:runQueue,
			Fun:Fun,
			buildLibFun:function(k,fun) {
				return new LibFun(k,fun);
			},
			buildUserFun:function(exp,scope) {
				return new UserFun(exp,scope);
			}
		};
	}
})