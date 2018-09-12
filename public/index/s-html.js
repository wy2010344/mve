({
	data:{
		SLisp:"./S-Lisp/index.js",
		interpret:"./S-Lisp/interpret.js",
		s:"./S-Lisp/s.js",
		sHtml:{
			url:"./S-Lisp/index/s-html.lisp",
			type:"path"
		}
	},
	success:function() {
		if(cp.query.path){
			var r=lib.SLisp.run(
				lib.sHtml,
				[
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
										return lib.s.map_from_kvs(
											node.First().exec(null)
										);
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