({
	data:{
		SLisp:"./S-Lisp/index.js",
		interpret:"./S-Lisp/interpret.js",
		s:"./S-Lisp/s.js"
	},
	success:function() {
		if(cp.query.path){
			var r=lib.SLisp.run(
				pathOf("./S-Lisp/index/s-html.lisp"),
				[
					{
						url:pathOf("./S-Lisp/util/mve_DOM/index.lisp"),
						delay_args:[],
						key:"mve"
					},
					{
						value:cp.query.path,
						key:"index-path"
					}
				]
			);
			return mve(function(me) {
				var div=me.Value({type:"div"});
				r.exec(
					lib.s.extend(
						lib.interpret.buildLibFun(
							"",
							function(node) {
								div({
									type:function() {
										var x=lib.s.map_from_kvs(
											node.First().exec(null)
										);
										document.title=x.title||"";
										return x;
									}
								});
							}
						)
					)
				);
				return {
					element:function() {
						return div();
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