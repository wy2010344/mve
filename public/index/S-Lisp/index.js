({
	data:{
		tokenize:"./tokenize.js",
		interpret:"./interpret.js",
		parse:"./parse.js",
		load:"./load.js",
		library:"./library.js",
		s:"./s.js"
	},
	delay:true,
	success:function() {
		return {
			run:function(path,defs,deal) {
				return lib.load(lib.library(),defs,deal).load(path);
			},
			shell:function(appendLog,appendResult,deal) {
				var x=lib.load(lib.library(appendLog),[],deal);
				var rq=lib.interpret.runQueue(x.scope);
				return function(txt){
					var r=rq(lib.parse(lib.tokenize(txt)).children);
					appendResult(lib.s.log(r));
				};
			}
		};
	}
})