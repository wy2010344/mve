
export function div(p:{
	text:()=>string
}){
	return mve.renders(function(){
		return function(me){
			return {
				init() {
					mb.log("我是可选的init函数，在附着到DOM上后执行");
				},
				element:[
					{
						type:"div",
						text() {
							return p.text()
						}
					}
				]
			}
		}
	})
}