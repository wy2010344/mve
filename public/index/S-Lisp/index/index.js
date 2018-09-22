({
	data:{
		SLisp:"../index.js",
		s:"../s.js",
		path:{
			url:"./index.lisp",
			type:"path"
		},
		mve_DOM:{
			url:"../util/mve_DOM.lisp",
			type:"path"
		}
	},
	success:function(){
		var r=lib.SLisp.run(
			lib.path,
			[
				{
					url:lib.mve_DOM,
					delay_args:[],
					key:"mve"
				}
			]
		);
		var xs=r.exec(null);
		return lib.s.map_from_kvs(xs);
	}
});