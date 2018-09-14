({
	data:{
		tokenize:"./tokenize.js",
		parse:"./parse.js",
		interpret:"./interpret.js",
		s:"./s.js",
		core:{
			url:"./core.js",
			type:function(url,notice) {
				if(mb.ext){
					notice(function(path) {
						return mb.ext(
							"readTxt",
							{
								path:path
							}
						);
					});
				}else{
					mb.ajax.text({
						url:url,
						success:function(text){
							var core=JSON.parse(text);
							notice(function(path) {
								if (!path.startsWith("index")) {
									path=path.substr(path.indexOf("index"));
								}
								return core[path];
							});
						}
					});
				}
			}
		},
		lib_path:{
			url:"./util/index.lisp",
			type:"path"
		}
	},
	delay:true,
	success:function(){
		var core={};
		var onload=false;
		var load=function(path,scope,deal) {
			if(onload){
				throw "不允许加载时加载";
			}else{
				var r=core[path];
				if(r){
					return r[0];
				}else{
					try{
						var txt=lib.core(path);
						if(txt){
							if(deal){
								txt=deal(path,txt).txt;
							}
							onload=true;
							var fun=lib.interpret.buildUserFun(
								lib.parse(lib.tokenize(txt)),
								lib.s.kvs_extend(
									"load",
									lib.interpret.buildLibFun(
										"load",
										function(node){
											return load(
												mb.ajax.require.calUrl("",path,node.First()),
												scope,
												deal
											);
										}
									),
									lib.s.kvs_extend(
										"pathOf",
										lib.interpret.buildLibFun(
											"pathOf",
											function(node) {
												return mb.ajax.require.calUrl("",path,node.First());
											}
										),
										scope
									)
								)
							);
							var r=fun.exec(null);
							core[path]=[r];
							onload=false;
							return r;
						}else{
							throw "未找到定义:"+path
						}
					}catch(ex){
						throw path+":"+ex;
					}
				}
			}
		};
		
		var parse=function(txt,scope) {
			var fun=lib.interpret.buildUserFun(
					lib.parse(lib.tokenize(txt)),
					scope
				);
			return fun.exec(null);
		};
		var appendKVS=function(r,scope) {
			var t=r;
			while(t!=null){
				var k=t.First();
				t=t.Rest();
				var v=t.First();
				t=t.Rest();
				//扩展基础库
				scope=lib.s.kvs_extend(k,v,scope);
			}
			return scope;
		};
		return function(base_scope,defs,deal) {
			var scope=base_scope;
			scope=lib.s.kvs_extend("base-scope",base_scope,scope);
			scope=lib.s.kvs_extend(
				"parse",
				lib.interpret.buildLibFun(
					"parse",
					function(node){
						var txt=node.First();
						node=node.Rest();
						var scope=base_scope;
						if(node){
							scope=node.First();
						}
						return parse(txt,scope);
					}
				),
				scope
			);
			scope=appendKVS(load(lib.lib_path,scope,deal),scope);
			if(defs){
				mb.Array.forEach(defs,function(def,i) {
					if(def.url){
						var r=load(def.url,scope,deal);
						if(def.delay){
							r=r.exec(null);
						}
						if(def.key){
							scope=lib.s.kvs_extend(def.key,r,scope);
						}else{
							scope=appendKVS(r,scope);
						}
					}else{
						if(def.value){
							scope=lib.s.kvs_extend(def.key,def.value,scope);
						}
					}
				});
			}
			return {
				load:function(path) {
					return load(path,scope,deal);
				},
				scope:scope,
				parse:parse
			};
		};
	}
})