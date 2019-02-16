({
	data:{
		SLisp:"../index.js",
		s:"../s.js"
	},
	success:function(){
		var r=lib.SLisp.run(
			pathOf("./index.lisp"),
			[
				{
					url:"lib-path/mve/DOM/index.lisp",
					delay_args:[],
					key:"mve"
				}
			]
		);
		var xs=r.exec(null).exec();
		return lib.s.map_from_kvs(xs);
	}
});