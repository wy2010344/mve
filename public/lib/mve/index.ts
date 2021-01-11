import { VirtualChildParam } from "./virtualTreeChildren"
import { mve,EOParseResult, BuildResult, orRun } from "./util"
import { childrenBuilder, JOChildren } from "./childrenBuilder"
import { singleBuilder, SingleParam } from "./singleModel"
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
      parseUtil.bind(me,v,function(value){
        fun(k,value)
      })
    })
  }
}

export interface ParseOfResult<JO,EO>{
  view(me:mve.LifeModel,child:JO):EOParseResult<EO>,
  mve(fun:(me:mve.LifeModel)=>JO):EOParseResult<EO>,
  children(me:mve.LifeModel,p:VirtualChildParam<EO>,children:JOChildren<JO,EO>):BuildResult
  single(p:SingleParam<EO>,me:mve.LifeModel,target:JO):BuildResult
}

export function parseOf<JO,EO>(view:(me:mve.LifeModel,child:JO)=>EOParseResult<EO>):ParseOfResult<JO,EO>{
  return {
    view,
    /**自己作为返回节点的情况 */
    mve(fun:(me:mve.LifeModel)=>JO){
			const life=mve.newLifeModel()
			const vr=view(life.me,fun(life.me))
			const destroy=vr.destroy
			vr.destroy=function(){
        orRun(destroy)
				life.destroy()
			}
			return vr
    },
    /**自己作为多节点的情况 */
    children:childrenBuilder(view),
    /**自己的子单节点的情况 */
    single:singleBuilder(view)
  }
}