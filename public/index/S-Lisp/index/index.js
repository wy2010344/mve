({
	data:{
		SLisp:"../index.js",
		s:"../s.js"
	},
	success:function(){
		var r=lib.SLisp.run(pkg.required_url,"./index.lisp");
		var m=lib.s.map_from_kvs(r);
		return m;
	}
});