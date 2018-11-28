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
					url:pathOf("../util/mve_DOM/index.lisp"),
					delay_args:[],
					key:"mve"
				}
			]
		);
		var xs=r.exec(null);
		return lib.s.map_from_kvs(xs);
	}
});