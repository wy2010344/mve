({
	success:function(p) {
		return mve(function(me) {
			return {
				init:function() {
					mb.log("我是可选的init函数，在附着到DOM上后执行");
				},
				element:{
					type:"div",
					text:function() {
						return p.text()
					}
				}
			}
		});
	}
})