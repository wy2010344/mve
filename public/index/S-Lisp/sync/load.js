({
	data:{
		tokenize:"../tokenize.js",
		treeLize:"../treeLize.js",
		interpret:"./interpret.js",
		core:function(notice) {
			mb.ajax.get({
				url:pkg.absolute_path("../core.js"),
				success:function(xhr){
					notice(JSON.parse(xhr.responseText));
				}
			});
		}
	},
	delay:true,
	success:function(){
		var util=lib.interpret.util;
		var core={};
		var scope;
		var load=function(base,relative) {
			var path=pkg.absolute_path(relative,base);
			var r=core[path];
			if(r){
				return r[0];
			}else{
				var txt=lib.core[path];
				if(txt){
					var fun=lib.interpret.buildFunc(
						lib.treeLize(lib.tokenize(lib.core[path])),
						util.kvs_extend(
							"load",
							lib.interpret.buildLibFun(
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
			}
		};
		
		return function(library) {
			scope=library(
				function(fun) {
					return lib.interpret.buildLibFun(fun);
				},
				lib.interpret.buildLibFun(function(node) {
					var run=node.First();
					node=node.Rest();
					var args=node.First();
					return run.exec(args);
				})
			);
			var r=load(null,"../util/index.lisp");		
			var t=r;
			while(t!=null){
				var k=t.First();
				t=t.Rest();
				var v=t.First();
				t=t.Rest();
				//扩展基础库
				scope=util.kvs_extend(k,v,scope);
			}
			return {
				load:load,
				scope:scope
			};
		};
	}
})