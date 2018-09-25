({
	data:{
		s:"./s.js"
	},
	delay:true,
	success:function() {
		var getPath=function(scope) {
			var pathOf=lib.s.kvs_find1st(scope,"pathOf");
			if(pathOf && pathOf.isFun){
				return pathOf.exec(null);
			}else{
				return "";
			}
		};
		
		var match_Exception=function(scope,msg,loc){
			return lib.s.LocationException(getPath(scope)+":\t"+msg,loc);
		};
		var calNodes=function(children,scope) {
			var r=null;
			while(children!=null){
				var child=children.First();
				r=lib.s.extend(interpret(child,scope),r);
				children=children.Rest();
			}
			return r;
		};
		var error_throw=function(msg,exp,scope,children) {
			return lib.s.LocationException(getPath(scope)+":\t"+msg+"\r\n"+exp.toString(true)+"\r\n"+children.toString(true),exp.loc);
		};
		var interpret=function(input,scope) {
			if(input.type=="()"){
				var nodes=calNodes(input.r_children,scope);
				var first=nodes.First();
				if(first && first.isFun){
					try{
						return first.exec(nodes.Rest());
					}catch(err){
						if(err.isLocationException){
							err.addStack(getPath(scope),input.loc,input.toString());
							throw err;
						}else{
							throw error_throw(err,input,scope,nodes);
						}
					}
				}else{
					throw error_throw("参数0必须为函数",input,scope,nodes);
				}
			}else
			if (input.type=="[]") {
				return calNodes(input.r_children,scope);
			}else
			if(input.type=="{}"){
				return new UserFun(input,scope);
			}else
			if(input.type=="id"){
				var paths=input.paths;
				if(paths==null){
					throw match_Exception(scope,input.value+"不是合法的ID类型23",input.loc);
				}else{
					var c_scope=scope;
					var value=null;
					while(paths!=null){
						var key=paths.First();
						value=lib.s.kvs_find1st(c_scope,key);
						paths=paths.Rest();
						if(paths!=null){
							if(value.isList){
								c_scope=value;
							}else{
								throw match_Exception(scope,"计算"+paths.toString()+",其中"+value+"不是合法的kvs类型:\t"+input.value,input.loc);
							}
						}
					}
					return value;
				}
			}else{
				return input.value;
			}
		};

			
		var letSmallMatch=function(small,vs,scope){
			var ks=small.children;
			if(vs==null || vs.isList){
				while(ks!=null){
					var v=null;
					if(vs!=null){
						v=vs.First();
					}

					var k=ks.First();
					ks=ks.Rest();
					if(k.type=="let-id"){
						scope=lib.s.kvs_extend(k.value,v,scope);
					}else
					if(k.type=="let-()"){
						scope=letSmallMatch(k,v,scope);
					}else
					if(k.type=="let-..."){
						scope=lib.s.kvs_extend(k.value,vs,scope);
					}else{
						throw lib.s.LocationException("非法"+k.toString(),k.loc);
					}

					if(vs!=null){
						vs=vs.Rest();
					}
				}
				return scope;
			}else{
				throw lib.s.LocationException(vs.toString()+"不是合法的list类型，无法参与无组匹配："+small.toString(),small.loc);
			}
		};
		var runQueue=function(scope) {
			return function(exps) {
				var r=null;
				while(exps!=null){
					var exp=exps.First();
					if(exp.type=="let"){
						var cs=exp.children.Rest();
						while(cs!=null){
							var key=cs.First();
							cs=cs.Rest();
							var value=interpret(cs.First(),scope);
							cs=cs.Rest();

							if(key.type=="let-id"){
								scope=lib.s.kvs_extend(key.value,value,scope);
							}else
							if(key.type=="let-()"){
								scope=letSmallMatch(key,value,scope);
							}
						}
						r=null;
					}else{
						r=interpret(exp,scope);
					}
					exps=exps.Rest();
				}
				return r;
			};
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