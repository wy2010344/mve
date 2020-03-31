import { ifChildren } from "../lib/mve/ifChildren";

export function div(p:{
	text:()=>string
}){
	return ifChildren(function(me){
		return {
			init() {
				mb.log("我是可选的init函数，在附着到DOM上后执行");
			},
			elements:[
				{
					type:"div",
					text() {
						return p.text()
					}
				}
			]
		}
	})
}