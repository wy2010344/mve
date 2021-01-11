
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
export type StringValue=mve.TValue<string>
export type ItemValue=mve.TValue<string|number|boolean>
export type AttrMap={[key:string]:ItemValue}
export type PropMap={ [key: string]:mve.TValue<string|number|boolean>}
export type StyleMap={[key:string]:mve.TValue<string>}

export type ActionHandler=(e) => void
/**动作树 */
export type ActionItem=ActionHandler | {
	capture?:boolean
	handler:ActionHandler
}
export function reDefineActionHandler(e:ActionItem,fun:(h:ActionHandler)=>ActionHandler){
	if(e){
		if(typeof(e)=="function"){
			return fun(e)
		}else{
			e.handler=fun(e.handler)
			return e
		}
	}
}
export type ActionMap={[key: string]: ActionItem}
export interface PNJO{
	type:string,
	init?(v):void
	destroy?(v):void
	id?:(o:any)=>void;
	cls?:StringValue;
	text?: ItemValue;
	value?: ItemValue;
	attr?: AttrMap;
	style?: StyleMap;
	prop?:PropMap;
	action?: ActionMap;
	children?:JOChildren<NJO,Node>
}
/**所有子节点类型 */
export type NJO=PNJO|string

function buildParam(me:mve.LifeModel,el:Node,child:PNJO){
	if(child.id){
		child.id(el)
	}
	if(child.action){
		mb.Object.forEach(child.action,function(v,k){
			DOM.action(el,k,v)
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
	if(child.prop){
		parseUtil.bindKV(me,child.prop,function(k,v){
			DOM.prop(el,k,v)
		})
	}
	//value必须在Attr后面才行，不然type=range等会无效
	if(child.value != null){
		parseUtil.bind(me,child.value,function(v){
			DOM.value(el,v)
		})
	}
	if(child.text != null){
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

function buildChildren(
	me:mve.LifeModel,
	el:Node,
	child:PNJO,
	buildChildren:(me:mve.LifeModel,p:VirtualChildParam<Node>,children:JOChildren<NJO,Node>)=>BuildResult
){
	if(child.children){
		if(child.text){
			mb.log("已经有text了，不应该有children",child)
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
	return buildResult(element,ci,childResult)
})
export const newline={type:"br"}
