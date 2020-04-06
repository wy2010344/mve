
import DOM = require("./DOM")
import { parseOf, parseUtil, ParseOfResult} from "../mve/index"
import { JOChildren } from "../mve/childrenBuilder"
import { BuildResult } from "../mve/model"
import { VirtualChildParam } from "../mve/virtualTreeChildren"
import { mve } from "../mve/util"
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
type StringValue=mve.TValue<string>
type ItemValue=mve.TValue<string|number>
type ItemMap={[key:string]:ItemValue}
type PropMap={ [key: string]:mve.TValue<string|number|boolean>}
type StringMap={[key:string]:StringValue}
type ActionMap={[key: string]: ((e) => void)}
export interface PNJO{
	type:string,
	id?:(o:any)=>void;
	cls?:StringValue;
	text?: ItemValue;
	value?: ItemValue;
	attr?: ItemMap;
	style?: StringMap;
	prop?:PropMap;
	action?: ActionMap;
	children?:JOChildren<NJO,Node>
}
export type NJO=PNJO|string

function buildParam(me:mve.LifeModel,el:Node,child:PNJO){
	if(child.id){
		child.id(el)
	}
	if(child.value){
		parseUtil.bind(me,child.value,function(v){
			DOM.value(el,v)
		})
	}
	if(child.text){
		parseUtil.bind(me,child.text,function(v){
			DOM.content(el,v)
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
	if(child.action){
		mb.Object.forEach(child.action,function(v,k){
			DOM.action(el,k,v)
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
			mb.log("已经有text了，不应该有children",child)
		}else{
			return buildChildren(me,new DOMVirtualParam(el),child.children)
		}
	}
}
export const parseHTML:ParseOfResult<NJO,Node>=parseOf(function(me,child){
	if(typeof(child)=='string'){
		return {
			element:DOM.createTextNode(child),
			init(){},
			destroy(){}
		}
	}else
	if(child){
		if(child.type=="svg"){
			return parseSVG.view(me,child)
		}else{
			const element=DOM.createElement(child.type)
			buildParam(me,element,child)
			const childResult=buildChildren(me,element,child,parseHTML.children)
			return{
				element,
				init(){
					if(childResult){
						childResult.init()
					}
				},
				destroy(){
					if(childResult){
						childResult.destroy()
					}
				}
			}
		}
	}else{
		mb.log(`child为空，不生成任何东西`)
	}
})
export const parseSVG:ParseOfResult<PNJO,Node>=parseOf(function(me,child){
	const element=DOM.createElementNS(child.type,"http://www.w3.org/2000/svg")
	buildParam(me,element,child)
	const childResult=buildChildren(me,element,child,parseSVG.children)
	return {
		element,
		init(){
			if(childResult){
				childResult.init()
			}
		},
		destroy(){
			if(childResult){
				childResult.destroy()
			}
		}
	}
})