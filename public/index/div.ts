import { dom } from "../lib/mve-DOM/index";
import { ChildLife } from "../lib/mve/childrenBuilder";
import { ifChildren } from "../lib/mve/ifChildren";

export function div(p:{
	text:()=>string
}){

	class Test{
		toString(){
			return "eafewf"
		}
	}
	new Test().toString()
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

	return ifChildren<Node>(function(me){
		return [
			ChildLife.of({
				init() {
					mb.log("我是可选的init函数，在附着到DOM上后执行");
				}
			}),
			dom({
				type:"div",
				text() {
					return p.text()
				}
			})
		]
	})
}