({
	data:{
        library:"../library.js",
		load:"../sync/load.js",
		util:"../util.js"
	},
	success:function(){
		var x=lib.load(
			lib.library(
				function(cs) {
					mb.log.apply(null,cs);
				}
			)
		);
		var r=x.load(pkg.required_url,"./index.lisp");
		var m=lib.util.map_from_kvs(r);
		return m;
	}
});