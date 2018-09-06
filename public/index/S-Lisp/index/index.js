({
	data:{
		SLisp:"../index.js",
		s:"../s.js",
		path:{
			url:"./index.lisp",
			type:"path"
		},
		mve:{
			url:"../util/mve/index.lisp",
			type:"path"
		}
	},
	success:function(){
		var r=lib.SLisp.run(
			lib.path,
			[
				{
					url:lib.mve,
					delay:true,
					key:"mve"
				}
			]
		);
		var m=lib.s.map_from_kvs(r.exec(null));
		return m;
	}
});