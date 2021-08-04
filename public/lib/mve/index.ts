import { EOChildFun } from "./childrenBuilder"
import { BuildResult, BuildResultList, EOParseResult, mve, onceLife } from "./util"

export const parseUtil={
  bind<T>(me:mve.LifeModel,value:mve.MTValue<T>,fun:(v:T)=>void){
    if(typeof(value)=='function'){
			if('after' in value && value.after){
				me.WatchAfter(value as mve.GValue<T>,function(v) {
					value.after(v,fun)
				})
			}else{
				me.WatchAfter(value as mve.GValue<T>,fun)
			}
    }else{
      fun(value)
    }
  },
  bindKV<T>(me:mve.LifeModel,map:{ [key: string]: mve.MTValue<T>},fun:(k:string,v:T)=>void){
    mb.Object.forEach(map,function(v,k){
      parseUtil.bind(me,v,function(value){
        fun(k,value)
      })
    })
  }
}

interface ElementResult<JO,EO>{
	(n:JO):EOChildFun<EO>
	one(me:mve.LifeModel,n:JO,life?:BuildResult):EOParseResult<EO>
	root(fun:(me:mve.LifeModel)=>JO):EOParseResult<EO>
}
/**原始的组装*/
export function buildElementOrginal<JO,EO>(
	fun:(me:mve.LifeModel,n:JO,life?:BuildResult)=>EOParseResult<EO>
){
	const out:ElementResult<JO,EO>=function(n){
		return function(parent,me){
			const out=fun(me,n)
			parent.push(out.element)
			return out
		}
	}
	out.one=fun
	out.root=function(cal){
		const life=mve.newLifeModel()
		return fun(life.me,cal(life.me),life)
	}
	return out
}
/**通用的子元素组装 */
export function buildElement<JO,EO>(
	fun:(me:mve.LifeModel,n:JO,out:BuildResultList)=>EO
){
	return buildElementOrginal<JO,EO>(function(me,n,life){
		const out=BuildResultList.init()
		const element=fun(me,n,out)
		if(life){
			out.push(life)
		}
		return onceLife(out.getAsOne(element)).out
	})
}