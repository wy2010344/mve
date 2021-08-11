
import { EOChildren,childrenBuilder } from "../mve/childrenBuilder"
import { buildElement, buildElementOrginal, parseUtil } from "../mve/index"
import { BuildResult, BuildResultList, mve, onceLife } from "../mve/util"
import { VirtualChildParam } from "../mve/virtualTreeChildren"
import * as DOM from "./DOM"
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
export type StyleMap={
	[key:string]:mve.MTValue<string>
}&{
	opacity?:mve.MTValue<number|string>
}
export type EventHandler=(e) => void
/**动作树 */
export type EventItem=EventHandler | {
	capture?:boolean
	handler:EventHandler
} | EventItem[]
export type EventMap = { [key:string]: EventItem }
export function reWriteEvent(n:EventMap,eventName:string,fun:(vs:EventItem[])=>EventItem[]){
	const v=n[eventName]
	if(mb.Array.isArray(v)){
		n[eventName]=fun(v)
	}else
	if(v){
		n[eventName]=fun([v])
	}else{
		n[eventName]=fun([])
	}
}




type InitFun=(v,me:mve.LifeModel)=>void
export function reWriteInit(v:DOMNode,fun:(vs:InitFun[])=>InitFun[]){
	if(mb.Array.isArray(v.init)){
		v.init=fun(v.init)
	}else
	if(v.init){
		v.init=fun([v.init])
	}else{
		v.init=fun([])
	}
}

type DestoryFun=(v)=>void
export function reWriteDestroy(v:DOMNode,fun:(vs:DestoryFun[])=>DestoryFun[]){
	if(mb.Array.isArray(v.destroy)){
		v.destroy=fun(v.destroy)
	}else
	if(v.destroy){
		v.destroy=fun([v.destroy])
	}else{
		v.destroy=fun([])
	}
}
export interface DOMNode{
	type:string
	init?:InitFun|InitFun[]
	destroy?:DestoryFun|DestoryFun[]
	id?:StringValue
	cls?:StringValue
	attr?: AttrMap
	style?: StyleMap
	prop?:PropMap
	event?: EventMap

	value?: ItemValue
	children?:EOChildren<Node>
	text?: ItemValue
}
export type DOMNodeAll=DOMNode|string

function buildParam(me:mve.LifeModel,el:Node,child:DOMNode){
	if(child.event){
		mb.Object.forEach(child.event,function(v,k){
			if(mb.Array.isArray(v)){
				mb.Array.forEach(v,function(v){
					DOM.event(el,k,v)
				})
			}else{
				DOM.event(el,k,v)
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
	if(child.prop){
		parseUtil.bindKV(me,child.prop,function(k,v){
			DOM.prop(el,k,v)
		})
	}
	if(child.cls){
		parseUtil.bind(me,child.cls,function(v){
			DOM.attr(el,"class",v)
		})
	}
	if(child.id){
		parseUtil.bind(me,child.id,function(v){
			DOM.attr(el,"id",v)
		})
	}
	if(child.text){
		parseUtil.bind(me,child.text,function(v){
			DOM.content(el,v)
		})
	}
	const ci:BuildResult={}
	if(child.init){
		if(mb.Array.isArray(child.init)){
			const inits=child.init
			for(let init of inits){
				init(el,me)
			}
		}else{
			const init=child.init
			ci.init=function(){
				init(el,me)
			}
		}
	}
	if(child.destroy){
		if(mb.Array.isArray(child.destroy)){
			const destroys=child.destroy
			ci.destroy=function(){
				for(let destroy of destroys){
					destroy(el)
				}
			}
		}else{
			const destroy=child.destroy
			ci.destroy=function(){
				destroy(el)
			}
		}
	}
	return ci
}
function buildParamAfter(me:mve.LifeModel,el:Node,child:DOMNode){
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
export const dom=buildElementOrginal<DOMNodeAll,Node>(function(me,n,life){
	if(typeof(n)=='string'){
		const txt=DOM.createTextNode(n)
		if(life){
			return {element:txt,init:life.init,destroy:life.destroy}
		}else{
			return {element:txt,init:null,destroy:null}
		}
	}else{
		const element=DOM.createElement(n.type)
		const out=BuildResultList.init()
		const ci=buildParam(me,element,n)
		if('children' in n){
			const children=n.children
			if(children){
				out.push(childrenBuilder(me,new DOMVirtualParam(element),children))
			}
		}
		buildParamAfter(me,element,n)
		out.push(ci)
		if(life){
			out.push(life)
		}
		return onceLife(out.getAsOne(element)).out
	}
})
export const svg=buildElement<DOMNode,Node>(function(me,n,out){
	const element=DOM.createElementNS(n.type,"http://www.w3.org/2000/svg")
	const ci=buildParam(me,element,n)
	if('children' in n){
		const children=n.children
		if(children){
			out.push(childrenBuilder(me,new DOMVirtualParam(element),children))
		}
	}
	buildParamAfter(me,element,n)
	out.push(ci)
	return element
})


let idCount=0
/**生成唯一ID*/
export function idOf(name:string){
	return name+(idCount++)
}
let clsCount=0
/**生成唯一class */
export function clsOf(name:string){
	return name+(clsCount++)
}