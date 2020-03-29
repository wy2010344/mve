import { VirtualChild} from "./virtualTreeChildren"
import { onceLife } from "./onceLife"






type EmptyFun=()=>void;
/**
 * 单元素的解析返回
 */
export type EOParseResult<EO>={
	element:EO,
	init:EmptyFun,
	destroy:EmptyFun
}

/**
 * 传进来的类型
 */
export type JOFun<JO,EO,PEO>=(mx:MXO<JO,EO,PEO>,parent:VirtualChild<PEO,EO>)=>BuildChildrenResult
export type JOChildType<JO,EO,PEO>=JO | JOFun<JO,EO,PEO>

/**兼容多种简化格式 */
export type JOChildren<JO,EO,PEO>=JOChildType<JO,EO,PEO>[] | JOChildType<JO,EO,PEO> | {
  init?():void,
  destroy?():void,
  elements:JOChildren<JO,EO,PEO>
}

export function isJOChildFunType<JO,EO,PEO>(child:JOChildType<JO,EO,PEO>):child is JOFun<JO,EO,PEO>{
	return typeof(child)=='function'
}

export interface BuildChildrenResult{
  init():void,
  destroy():void
}
export interface MXO<JO,EO,PEO>{
  buildChildren(
    me:mve.Inner,
    item:JOChildren<JO,EO,PEO>,
    parent:VirtualChild<PEO,EO>
  ):BuildChildrenResult
}
export function superChildrenBuilder<JO,EO,PEO>(p:{
  parseChild(me:mve.Inner,child:JO):EOParseResult<EO>,
  append(pel:PEO,el:EO,isMove?:boolean):void,
  insertBefore(pel:PEO,el:EO,old:EO,isMove?:boolean):void,
  remove(pel:PEO,el:EO):void
}){
  function getItem(item:JOChildren<JO,EO,PEO>,inits:EmptyFun[],destroys:EmptyFun[]):JOChildType<JO,EO,PEO>[]{
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
  const mx:MXO<JO,EO,PEO>={
    buildChildren(me,item,parent){
      const inits:EmptyFun[]=[],destroys:EmptyFun[]=[]
      const children=getItem(item,inits,destroys)
      const array:BuildChildrenResult[]=[]
      let i=0
      while(i<children.length){
        const child=children[i]
        i++
        if(isJOChildFunType(child)){
          const cv=parent.newChildAtLast()
          array.push(child(mx,cv))
        }else{
          const o=p.parseChild(me,child)
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

  return function(me:mve.Inner,pel:PEO,children:JOChildren<JO,EO,PEO>){
    const vm=VirtualChild.newRootChild(p,pel)
    return mx.buildChildren(me,children,vm)
  }
}