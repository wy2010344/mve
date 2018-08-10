({
	data:{
		tokenize:"../tokenize.js",
		treeLize:"../treeLize.js",
		interpret:"./interpret.js",
		load:"./load.js"
	},
	success:function(library) {
		var x=lib.load(library);
		var rq=lib.interpret.runQueue(x.scope);
		return function(txt) {
			mb.log(txt);
			var cs=lib.treeLize(lib.tokenize(txt)).children;
			var r=null;
			mb.Array.forEach(cs,function(c,i) {
				mb.log(i);
				r=rq(c);
			});
			return r;
		};
	}
})