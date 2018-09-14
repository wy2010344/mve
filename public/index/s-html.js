({
	data:{
		SLisp:"./S-Lisp/index.js",
		interpret:"./S-Lisp/interpret.js",
		s:"./S-Lisp/s.js",
		mve:{
			url:"./S-Lisp/util/mve/index.lisp",
			type:"path"
		},
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
						url:lib.mve,
						delay:true,
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