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
			run:function(base,path) {
				return lib.load(lib.library()).load(base,path);
			},
			shell:function(appendLog,appendResult) {
				var x=lib.load(lib.library(appendLog));
				var rq=lib.interpret.runQueue(x.scope);
				return function(txt){
					var r=rq(lib.parse(lib.tokenize(txt)).children);
					appendResult(lib.s.log(r));
				};
			}
		};
	}
})