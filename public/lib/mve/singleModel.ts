import { mve,EOParseResult, BuildResult  } from "./util";



export interface SingleParam<EO>{
  (el?:EO):void
}
export type SingleTargetFun<JO,EO>=(mx:SingleMXO<JO,EO>,set:SingleParam<EO>)=>BuildResult
export type SingleTarget<JO,EO> = JO | SingleTargetFun<JO,EO>

export interface SingleMXO<JO,EO>{
  (me:mve.LifeModel,target:SingleTarget<JO,EO>,set:SingleParam<EO>):BuildResult
}

function isSingleTargetFun<JO,EO>(target:SingleTarget<JO,EO>):target is SingleTargetFun<JO,EO>{
  return typeof(target)=='function'
}
/**单节点或有限节点*/
export function singleBuilder<JO,EO>(
  parseView:(me:mve.LifeModel,child:JO)=>EOParseResult<EO>
){ 
  const buildSingle:SingleMXO<JO,EO>=function(me,target,set):BuildResult{
		if(isSingleTargetFun(target)){
			return target(buildSingle,set)
		}else{
			const element=target
			const view=parseView(me,element)
			set(view.element)
			return view
		}
	}
  return function(p:SingleParam<EO>,me:mve.LifeModel,target:SingleTarget<JO,EO>){
    return buildSingle(me,target,p)
  }
}