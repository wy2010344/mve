import { EOParseResult, BuildResult } from "./model"
import { EmptyFun } from "../model"
import { VirtualChild, VirtualChildParam } from "./virtualTreeChildren"
import { onceLife } from "./onceLife"


/**
 * 传进来的类型
 */
export type JOChildFun<JO,EO>=(mx:ChildrenMXO<JO,EO>,parent:VirtualChild<EO>)=>BuildResult
export type JOChildType<JO,EO>=JO | JOChildFun<JO,EO>

type PureJOChildren<JO,EO>=JOChildType<JO,EO>[] | JOChildType<JO,EO>
/**兼容多种简化格式 */
export type JOChildren<JO,EO>= PureJOChildren<JO,EO> | {
  init?():void,
  destroy?():void,
  elements:PureJOChildren<JO,EO>
}

export function isJOChildFunType<JO,EO>(child:JOChildType<JO,EO>):child is JOChildFun<JO,EO>{
	return typeof(child)=='function'
}
export interface ChildrenMXO<JO,EO>{
  buildChildren(
    me:mve.Inner,
    item:JOChildren<JO,EO>,
    parent:VirtualChild<EO>
  ):BuildResult
}
function getItem<JO,EO>(
  item:JOChildren<JO,EO>,
  inits:EmptyFun[],
  destroys:EmptyFun[]
):JOChildType<JO,EO>[]{
  if(mb.Array.isArray(item)){
    return item
  }else
  if('elements' in item){
    if(item.init){
      inits.push(item.init)
    }
    if(item.destroy){
      destroys.push(item.destroy)
    }
    return getItem(item.elements,inits,destroys)
  }else{
    return [item]
  }
}
export function childrenBuilder<JO,EO>(
  parseView:(me:mve.Inner,child:JO)=>EOParseResult<EO>
){
  const mx:ChildrenMXO<JO,EO>={
    buildChildren(me,item,parent){
      const inits:EmptyFun[]=[],destroys:EmptyFun[]=[]
      const children=getItem(item,inits,destroys)
      const array:BuildResult[]=[]
      let i=0
      while(i<children.length){
        const child=children[i]
        i++
        if(isJOChildFunType(child)){
          const cv=parent.newChildAtLast()
          array.push(child(mx,cv))
        }else{
          const o=parseView(me,child)
          parent.push(o.element)
          array.push(o)
        }
      }
      const life=onceLife({
        init(){
          for(let i=0;i<array.length;i++){
            array[i].init()
          }
          for(let i=0;i<inits.length;i++){
            inits[i]()
          }
        },
        destroy(){
          for(let i=0;i<destroys.length;i++){
            destroys[i]()
          }
          for(let i=0;i<array.length;i++){
            array[i].destroy()
          }
        }
      })
      return life
    }
  }

  return function(me:mve.Inner,p:VirtualChildParam<EO>,children:JOChildren<JO,EO>){
    const vm=VirtualChild.newRootChild(p)
    return mx.buildChildren(me,children,vm)
  }
}