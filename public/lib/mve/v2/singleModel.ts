import { EOParseResult, BuildResult } from "./model";
import { onceLife } from "./onceLife";
import { EmptyFun } from "../model";



export interface SingleParam<EO>{
  set(el:EO):void,
  remove():void
}

export type SingleTargetType<JO>=JO | {
  init?():void,
  destroy?():void,
  element:JO
}
export type SingleTargetFun<JO,EO>=(mx:SingleMXO<JO,EO>,p:SingleParam<EO>)=>BuildResult
export type SingleTarget<JO,EO> = SingleTargetType<JO> | SingleTargetFun<JO,EO>

export interface SingleMXO<JO,EO>{
  buildSingle(me:mve.Inner,target:SingleTarget<JO,EO>,p:SingleParam<EO>):BuildResult
}

function isSingleTargetFun<JO,EO>(target:SingleTarget<JO,EO>):target is SingleTargetFun<JO,EO>{
  return typeof(target)=='function'
}
/**单节点或有限节点*/
export function singleBuilder<JO,EO>(
  parseView:(me:mve.Inner,child:JO)=>EOParseResult<EO>
){ 

  const mx:SingleMXO<JO,EO>={
    buildSingle(me,target,p):BuildResult{
      if(isSingleTargetFun(target)){
        return target(mx,p)
      }else{
        let init:EmptyFun,destroy:EmptyFun;
        let element:JO
        if('element' in target){
          init=target.init
          destroy=target.destroy
          element=target.element
        }else{
          element=target
        }
        const view=parseView(me,element)
        p.set(view.element)
        const life=onceLife({
          init(){
            view.init()
            if(init){
              init()
            }
          },
          destroy(){
            if(destroy){
              destroy()
            }
            view.destroy()
          }
        })
        return life
      }
    }
  }
  return function(p:SingleParam<EO>,me:mve.Inner,target:SingleTarget<JO,EO>){
    return mx.buildSingle(me,target,p)
  }
}