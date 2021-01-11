import { JOChildFun, JOChildren, JOChildType } from "./childrenBuilder";
import { ifChildren } from "./ifChildren";
import { mve } from "./util";



/**
 * 从一个列表转化到另一个列表，无缓存折
 * @param array 
 * @param fun 
 */
export function filterChildren<T,JO,EO>(
	array:()=>T[],
	fun:(me:mve.LifeModel,row:T,index:number)=>JOChildren<JO,EO>
):JOChildFun<JO,EO>{
	return ifChildren(function(me){
		const vs:JOChildType<JO,EO>[]=[]
		mb.Array.forEach(array(),function(row,index){
			const v=fun(me,row,index)
			if(mb.Array.isArray(v)){
				v.forEach(vi=>vs.push(vi))
			}else{
				vs.push(v)
			}
		})
		return vs
	})
}