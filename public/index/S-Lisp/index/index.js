({
	data:{
        library:"../library.js",
		load:"../sync/load.js",
		util:"../util.js"
	},
	success:function(){
		return mve(function(me){
			var x=lib.load(
				lib.library(
					function(cs) {
						mb.log.apply(null,cs);
					}
				)
			);
			/*
			lib.load(lib.library(),function(load,scope){
				load(pkg.required_url,"./index.lisp",function(r,err){
					try{
						mb.log(r,err);
						var m=lib.util.map_from_kvs(r);
						m.getElement.exec(null,function(el){
							//mb.log(el);
							me.k.root.appendChild(el);
						});
					}catch(e){
						mb.log(e);
					}
				});
			});
			*/
			return {
				init:function() {
					mb.log("init")
				},
				element:{
					type:"div",
					id:"root",
					children:[
						{
							type:function() {
								var r=x.load(pkg.required_url,"./index.lisp");
								var m=lib.util.map_from_kvs(r);
								/*
								m.init=function() {
									mb.log("自定义init")
								};*/
								return m;
							}
						}
					]
				}
			};
		});
	}
});