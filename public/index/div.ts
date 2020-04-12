import { ifChildren } from "../lib/mve/ifChildren";

export function div(p:{
	text:()=>string
}){

	/**
	 * 化简分数
	 * @param a 
	 * @param b 
	 */
	function simpleFraction(a:number,b:number){
		const min = a<b?a:b
		let i = 2
		while(i <= min){
			if(a % i == 0 && b % i == 0){
				a = a / i
				b = b / i
				i = 2
			}else{
				i++
			}
		}
		return [a,b]
	}

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