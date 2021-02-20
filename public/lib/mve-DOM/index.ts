
import DOM = require("./DOM")
import { parseOf,parseUtil} from "../mve/index"
import { JOChildren } from "../mve/childrenBuilder"
import { VirtualChildParam } from "../mve/virtualTreeChildren"
import { mve,BuildResult, EOParseResult, BuildResultList, onceLife } from "../mve/util"
export class DOMVirtualParam implements VirtualChildParam<Node>{
	constructor(
		private pel:Node
	){}
	append(el,isMove){
		DOM.appendChild(this.pel,el,isMove)
	}
	remove(el){
		DOM.removeChild(this.pel,el)
	}
	insertBefore(el,oldEl,isMove){
		DOM.insertChildBefore(this.pel,el,oldEl,isMove)
	}
}
/**
 * innerText和innserHTML没有必要
 * innerText就是子节点第一个是text
 * span的默认是容纳text，但text也只是一个子成员
 * innerHTML是危险的，是另一个注入体系，也不应该存在
 * 它应该先解析成ifChildren的成员，再注入进来。
 * 但是text自身的render怎么处理？
 * text作为普通节点，本身支持children的render。
 * 
 * 对外放出去的，必须是严格的节点
 * 所以children必须只有一种类型？其它是外部的简化语法与兼容？
 */
export type StringValue=mve.MTValue<string>
export type ItemValue=mve.MTValue<string|number|boolean>
export type AttrMap={[key:string]:ItemValue}
export type PropMap={ [key: string]:mve.MTValue<string|number|boolean>}
export type StyleMap={[key:string]:mve.MTValue<string>}

export type ActionHandler=(e) => void
/**动作树 */
export type ActionItem=ActionHandler | {
	capture?:boolean
	handler:ActionHandler
}
export type ActionMap={[key: string]: ActionItem | ActionItem[]}
/**
 * 重新定义动作
 * @param v 
 * @param fun 
 */
export function reWriteAction(v:ActionItem | ActionItem[] | null,fun:(vs:ActionItem[])=>ActionItem[]){
	if(mb.Array.isArray(v)){
		return fun(v)
	}else
	if(v){
		return fun([v])
	}else{
		return fun([])
	}
}
export interface PNJO{
	type:string
	init?(v):void
	destroy?(v):void
	id?:(o:any)=>void
	cls?:StringValue
	text?: ItemValue
	attr?: AttrMap
	style?: StyleMap
	prop?:PropMap
	action?: ActionMap
	children?:JOChildren<NJO,Node>
	value?: ItemValue
}
/**所有子节点类型 */
export type NJO=PNJO|string

function buildParam(me:mve.LifeModel,el:Node,child:PNJO){
	if(child.id){
		child.id(el)
	}
	if(child.action){
		mb.Object.forEach(child.action,function(v,k){
			if(mb.Array.isArray(v)){
				mb.Array.forEach(v,function(v){
					DOM.action(el,k,v)
				})
			}else{
				DOM.action(el,k,v)
			}
		})
	}
	if(child.style){
		parseUtil.bindKV(me,child.style,function(k,v){
			DOM.style(el,k,v)
		})
	}
	if(child.attr){
		parseUtil.bindKV(me,child.attr,function(k,v){
			DOM.attr(el,k,v)
		})
	}
	if(child.cls){
		parseUtil.bind(me,child.cls,function(v){
			DOM.attr(el,"class",v)
		})
	}
	if(child.prop){
		parseUtil.bindKV(me,child.prop,function(k,v){
			DOM.prop(el,k,v)
		})
	}
	if(child.text){
		parseUtil.bind(me,child.text,function(v){
			DOM.content(el,v)
		})
	}
	const ci:BuildResult={}
	if(child.init){
		ci.init=function(){
			child.init(el)
		}
	}
	if(child.destroy){
		ci.destroy=function(){
			child.destroy(el)
		}
	}
	return ci
}
function buildParamAfter(me:mve.LifeModel,el:Node,child:PNJO){
	/**
	 * value必须在Attr后面才行，不然type=range等会无效
	 * select的value必须放在children后，不然会无效
	 */
	if(child.value){
		parseUtil.bind(me,child.value,function(v){
			DOM.value(el,v)
		})
	}
}
function buildChildren(
	me:mve.LifeModel,
	el:Node,
	child:PNJO,
	buildChildren:(me:mve.LifeModel,p:VirtualChildParam<Node>,children:JOChildren<NJO,Node>)=>BuildResult
){
	if(child.children){
		if(child.text){
			mb.log("text与children冲突")
		}else{
			return buildChildren(me,new DOMVirtualParam(el),child.children)
		}
	}
}

function buildResult(element:HTMLElement,ci:BuildResult,childResult:BuildResult){
	const out=BuildResultList.init()
	out.orPush(childResult)
	out.push(ci)
	return onceLife({
		element,
		init:out.getInit(),
		destroy:out.getDestroy()
	}).out
}
export const parseHTML=parseOf<NJO,Node>(function(me,child){
	if(typeof(child)=='string'){
		return {
			element:DOM.createTextNode(child)
		}
	}else
	if(child){
		if(child.type=="svg"){
			return parseSVG.view(me,child)
		}else{
			const element=DOM.createElement(child.type)
			const ci=buildParam(me,element,child)
			const childResult=buildChildren(me,element,child,parseHTML.children)
			buildParamAfter(me,element,child)
			return buildResult(element,ci,childResult) as EOParseResult<Node>
		}
	}else{
		mb.log(`child为空，不生成任何东西`)
	}
})
export const parseSVG=parseOf<PNJO,Node>(function(me,child){
	const element=DOM.createElementNS(child.type,"http://www.w3.org/2000/svg")
	const ci=buildParam(me,element,child)
	const childResult=buildChildren(me,element,child, child.type=="foreignObject"?parseHTML.children:parseSVG.children)
	buildParamAfter(me,element,child)
	return buildResult(element,ci,childResult)
})
export const newline={type:"br"}
