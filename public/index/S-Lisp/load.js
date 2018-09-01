({
	data:{
		tokenize:"./tokenize.js",
		parse:"./parse.js",
		interpret:"./interpret.js",
		s:"./s.js",
		core:function(notice) {
			mb.ajax.get({
				url:pkg.absolute_path("./core.js"),
				success:function(xhr){
					notice(JSON.parse(xhr.responseText));
				}
			});
		}
	},
	delay:true,
	success:function(){
		var core={};
		var scope;
		var load=function(base,relative) {
			var path=pkg.absolute_path(relative,base);
			var r=core[path];
			if(r){
				return r[0];
			}else{
				try{
					var txt=lib.core[path];
					if(txt){
						var fun=lib.interpret.buildUserFun(
							lib.parse(lib.tokenize(txt)),
							lib.s.kvs_extend(
								"load",
								lib.s.buildLibFun(
									"load",
									function(node){
										return load(path,node.First());
									}
								),
								scope
							)
						);
						var r=fun.exec(null);
						core[path]=[r];
						return r;
					}else{
						throw "未找到定义:"+path
					}
				}catch(ex){
					throw path+":"+ex;
				}
			}
		};
		
		return function(base_scope) {
			scope=base_scope;
			var r=load(null,"./util/index.lisp");		
			var t=r;
			while(t!=null){
				var k=t.First();
				t=t.Rest();
				var v=t.First();
				t=t.Rest();
				//扩展基础库
				scope=lib.s.kvs_extend(k,v,scope);
			}
			return {
				load:load,
				scope:scope
			};
		};
	}
})