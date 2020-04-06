import { JOChildFun, JOChildren } from "./childrenBuilder";
import { ifChildren } from "./ifChildren";
import { mve } from "./util";




export function filterChildren<T,JO,EO>(
  array:()=>T[],
  fun:(me:mve.LifeModel,row:T,index:number)=>JOChildren<JO,EO>
):JOChildFun<JO,EO>{
  return ifChildren(function(me){
    return mb.Array.map(array(),function(row,index){
      return fun(me,row,index)
    })
  })
}