import { VirtualChild, VirtualChildParam } from "./virtualTreeChildren"
import { BuildResult, BuildResultList, EOParseResult, mve, onceLife } from "./util"

export function newArticle<JO,EO>(...lines:JOChildType<JO,EO>[]){
  return new Article(lines)
}
export class Article<JO,EO>{
  constructor(
    public readonly out:JOChildType<JO,EO>[]=[]
  ){}
  append(v:JOChildType<JO,EO>){
    this.out.push(v)
    return this
  }
}


/**重复的函数节点 */
export interface JOChildFun<JO,EO>{
	(mx:ChildrenMXO<JO,EO>,parent:VirtualChild<EO>):BuildResult
}
export interface ChildrenMXO<JO,EO>{
  (
    me:mve.LifeModel,
    item:JOChildren<JO,EO>,
    parent:VirtualChild<EO>
  ):BuildResult
}






/**子元素组的生命周期类型 */
export interface JOChildrenLifeType<JO,EO> extends BuildResult{
  elements:JOChildren<JO,EO>[]
}
/**单个非数组*/
export type JOChildType<JO,EO>=JO | JOChildFun<JO,EO> | JOChildrenLifeType<JO,EO>
/**子元素类型 */
export type JOChildren<JO,EO>=JOChildType<JO,EO>[] | JOChildType<JO,EO>

export function isJOChildFunType<JO,EO>(child:JOChildType<JO,EO>):child is JOChildFun<JO,EO>{
	return typeof(child)=='function'
}
export function isJOChildrenLifeType<JO,EO>(child:JOChildType<JO,EO>):child is JOChildrenLifeType<JO,EO>{
	return typeof(child)=='object' && 'elements' in child && mb.Array.isArray(child.elements)
}

function childBuilder<JO,EO>(
	out:BuildResultList,
	child:JOChildType<JO,EO>,
	parent:VirtualChild<EO>,
	me:mve.LifeModel,
	parse:(me:mve.LifeModel,child:JO)=>EOParseResult<EO>,
	buildChildren:ChildrenMXO<JO,EO>
){
	if(isJOChildFunType(child)){
		out.push(child(buildChildren,parent.newChildAtLast()))
	}else
	if(isJOChildrenLifeType(child)){
		out.push(child)
		childrenVSBuilder(out,child.elements,parent,me,parse,buildChildren)
	}else{
		const vs=parse(me,child)
		out.orPush(vs)
		parent.push(vs.element)
	}
}
function childrenVBuilder<JO,EO>(
	out:BuildResultList,
	child:JOChildren<JO,EO>,
	parent:VirtualChild<EO>,
	me:mve.LifeModel,
	parse:(me:mve.LifeModel,child:JO)=>EOParseResult<EO>,
	buildChildren:ChildrenMXO<JO,EO>
){
	if(mb.Array.isArray(child)){
		let i=0
		while(i<child.length){
			childBuilder(out,child[i],parent,me,parse,buildChildren)
			i++
		}
	}else{
		childBuilder(out,child,parent,me,parse,buildChildren)
	}
}
function childrenVSBuilder<JO,EO>(
	out:BuildResultList,
	children:JOChildren<JO,EO>[],
	parent:VirtualChild<EO>,
	me:mve.LifeModel,
	parse:(me:mve.LifeModel,child:JO)=>EOParseResult<EO>,
	buildChildren:ChildrenMXO<JO,EO>
){
	//数组元素
	let i=0
	while(i<children.length){
		const child=children[i]
		i++
		childrenVBuilder(out,child,parent,me,parse,buildChildren)
	}
}
export function childrenBuilder<JO,EO>(parse:(me:mve.LifeModel,child:JO)=>EOParseResult<EO>){
	const baseBuilder:ChildrenMXO<JO,EO>=function(me,children:JOChildren<JO,EO>,parent){
		const out=BuildResultList.init()
		childrenVBuilder(out,children,parent,me,parse,baseBuilder)
		return onceLife(out.getAsOne()).out
	}
	return function(me:mve.LifeModel,x:VirtualChildParam<EO>,children:JOChildren<JO,EO>){
		return baseBuilder(me,children,VirtualChild.newRootChild(x))
	}
}