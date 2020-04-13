import { BParam } from "../arraymodel";
import { VirtualChild, VirtualChildParam } from "../../mve/virtualTreeChildren";



export interface CResult{
  destroy():void
}
export interface CEResult<EO> extends CResult{
  element:EO
}

export type CChildFun<JO,EO>=(mx:MXO<JO,EO>,parent:VirtualChild<EO>)=>CResult
export type CChildType<JO,EO> = JO | CChildFun<JO,EO>
export interface MXO<JO,EO>{
  buildChildren(
    me:BParam,
    children:CChildType<JO,EO>[],
    parent:VirtualChild<EO>
  ):CResult
}
export function isJOChildFunType<JO,EO>(child:CChildType<JO,EO>):child is CChildFun<JO,EO>{
	return typeof(child)=='function'
}
export function childrenBuilder<JO,EO>(
  parseView:(me:BParam,child:JO)=>CEResult<EO>
){
  const mx:MXO<JO,EO>={
    buildChildren(me,children,parent){
      const array:CResult[]=[]
      let i=0
      while(i < children.length){
        const child = children[i]
        if(isJOChildFunType(child)){
          const cv=parent.newChildAtLast()
          array.push(child(mx,cv))
        }else{
          const o = parseView(me,child)
          parent.push(o.element)
          array.push(o)
        }
        i = i + 1
      }
      return {
        destroy(){
          array.forEach(function(row){
            row.destroy()
          })
        }
      }
    }
  }
  return function(me:BParam,p:VirtualChildParam<EO>,children:CChildType<JO,EO>[]){
    const vm=VirtualChild.newRootChild(p)
    return mx.buildChildren(me,children,vm)
  }
}