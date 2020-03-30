

import { EOParseResult, BuildResult } from "./model"
import { childrenBuilder, JOChildType } from "./childrenBuilder"
import { singleBuilder, SingleParam, SingleTarget } from "./singleModel"
import { VirtualChildParam } from "./virtualTreeChildren"


export const parseUtil={
  bind<T>(me:mve.Inner,value:mve.TValue<T>,fun:(v:T)=>void){
    if(typeof(value)=='function'){
      me.Watch({
        exp(){
          return (value as any)()
        },
        after:fun
      })
    }else{
      fun(value)
    }
  },
  bindKV<T>(me:mve.Inner,map:{ [key: string]: mve.TValue<T>},fun:(k:string,v:T)=>void){
    mb.Object.forEach(map,function(v,k){
      parseUtil.bind(me,map[k],function(v){
        fun(k,v)
      })
    })
  }
}
export interface ParseOfResult<JO,EO>{
  view(me:mve.Inner,child:JO):EOParseResult<EO>,
  mve(fun:(me:mve.Inner)=>EOParseResult<EO>):EOParseResult<EO>,
  children(me:mve.Inner,p:VirtualChildParam<EO>,children:JOChildType<JO,EO>):BuildResult
  single(p:SingleParam<EO>,me:mve.Inner,target:SingleTarget<JO,EO>):BuildResult
}
export function parseOf<JO,EO>(view:(me:mve.Inner,child:JO)=>EOParseResult<EO>):ParseOfResult<JO,EO>{
  return {
    view,
    /**自己作为返回节点的情况 */
    mve(fun:(me:mve.Inner)=>EOParseResult<EO>){
      const life=mve.lifeModel()
      const result=fun(life.me)
      const rDestroy=result.destroy
      result.destroy=function(){
        if(rDestroy){
          rDestroy()
        }
        life.destroy()
      }
      return result
    },
    /**自己作为多节点的情况 */
    children:childrenBuilder<JO,EO>(view),
    /**自己的子单节点的情况 */
    single:singleBuilder(view)
  }
}