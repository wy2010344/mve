import { VirtualChild, VirtualChildParam } from "./virtualTreeChildren"
import { BuildResult, BuildResultList, mve, onceLife } from "./util"

/**重复的函数节点/组件封装成mve*/
export interface EOChildFun<EO>{
	(parent:VirtualChild<EO>,me:mve.LifeModel):BuildResult
}

/**存放空的生命周期 */
export class ChildLife{
	constructor(public readonly result:BuildResult){}
	static of(result:BuildResult){
		return new ChildLife(result)
	}
}

export type EOChildren<EO>= EO | EOChildFun<EO> | EOChildren<EO>[] | ChildLife

export function isEOChildFunType<EO>(child:EOChildren<EO>):child is EOChildFun<EO>{
	return typeof(child)=='function'
}

function childBuilder<EO>(
	out:BuildResultList,
	child:EOChildren<EO>,
	parent:VirtualChild<EO>,
	me:mve.LifeModel
){
	if(mb.Array.isArray(child)){
		let i=0
		while(i<child.length){
			childBuilder(out,child[i],parent,me)
			i++
		}
	}else
	if(isEOChildFunType(child)){
		out.push(child(parent.newChildAtLast(),me))
	}else
	if(child instanceof ChildLife){
		out.push(child.result)
	}else{
		parent.push(child)
	}
}
export function baseChildrenBuilder<EO>(me:mve.LifeModel,children:EOChildren<EO>,parent:VirtualChild<EO>){
	const out=BuildResultList.init()
	childBuilder(out,children,parent,me)
	return onceLife(out.getAsOne()).out
}
export function childrenBuilder<EO>(me:mve.LifeModel,x:VirtualChildParam<EO>,children:EOChildren<EO>){
	return baseChildrenBuilder(me,children,VirtualChild.newRootChild(x))
}