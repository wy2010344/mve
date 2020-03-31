

import { EOParseResult, BuildResult, EmptyFun } from "./model"
import { childrenBuilder, JOChildType, JOChildren } from "./childrenBuilder"
import { singleBuilder, SingleParam, SingleTarget } from "./singleModel"
import { VirtualChildParam } from "./virtualTreeChildren"
import { mve } from "./util"
export const parseUtil={
  bind<T>(me:mve.LifeModel,value:mve.TValue<T>,fun:(v:T)=>void){
    if(typeof(value)=='function'){
      me.WatchAfter(
        function(){
          return (value as any)()
        },
        fun
      )
    }else{
      fun(value)
    }
  },
  bindKV<T>(me:mve.LifeModel,map:{ [key: string]: mve.TValue<T>},fun:(k:string,v:T)=>void){
    mb.Object.forEach(map,function(v,k){
      parseUtil.bind(me,map[k],function(v){
        fun(k,v)
      })
    })
  }
}

/**将out返回出去 */
export interface MveOuterResult<JO> extends EOParseResult<JO>{
  out:any
}

export interface ParseOfResult<JO,EO>{
  view(me:mve.LifeModel,child:JO):EOParseResult<EO>,
  mve(fun:(me:mve.LifeModel)=>EOParseResult<JO>):MveOuterResult<EO>,
  children(me:mve.LifeModel,p:VirtualChildParam<EO>,children:JOChildren<JO,EO>):BuildResult
  single(p:SingleParam<EO>,me:mve.LifeModel,target:SingleTarget<JO,EO>):BuildResult
}

export function parseOf<JO,EO>(view:(me:mve.LifeModel,child:JO)=>EOParseResult<EO>):ParseOfResult<JO,EO>{
  return {
    view,
    /**自己作为返回节点的情况 */
    mve(fun:(me:mve.LifeModel)=>MveOuterResult<JO>){
      const life=mve.newLifeModel()
      const uresult=fun(life.me)
      const presult=view(life.me,uresult.element)
      return {
        out:uresult.out,
        element:presult.element,
        init(){
          presult.init()
          uresult.init()
        },
        destroy(){
          uresult.destroy()
          presult.destroy()
        }
      }
    },
    /**自己作为多节点的情况 */
    children:childrenBuilder<JO,EO>(view),
    /**自己的子单节点的情况 */
    single:singleBuilder(view)
  }
}