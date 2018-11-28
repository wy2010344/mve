({
	data:{
		SLisp:"./S-Lisp/index.js",
		interpret:"./S-Lisp/interpret.js",
		s:"./S-Lisp/s.js"
	},
	success:function() {
		if(cp.query.path){
			var r=lib.SLisp.run(
				cp.query.path,
				[
					{
						url:pathOf("./S-Lisp/util/mve_DOM/index.lisp"),
						delay_args:[],
						key:"mve"
					}
				],
				function(path,txt) {
					if(path.endsWith("s-view")){
						txt="{(mve {"+txt+"})}";
					}
					return {
						txt:txt
					};
				}
			);
			return mve(function(me) {
				return {
					element:{
						type:function() {
							var o=r.exec(null);
							var x=lib.s.map_from_kvs(o);
							document.title=x.title||"";
							return x;
						}
					}
				};
			});
		}else{
			return mve(function(me) {
				return {
					element:{	
						type:"div",
						text:"期待一个文件"
					}
				};
			});
		}
	}
});