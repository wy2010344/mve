import { UAllView, VBuilder } from "./index";
import { JOChildren } from "../mve/childrenBuilder";
import { mve } from "../mve/util";
import { parseOf, parseUtil } from "../mve/index";
import { DOMVirtualParam } from "../mve-DOM/index";
import { UAbsView, buildAbs } from "./util";

export interface UView extends UAbsView{
	type:"view",
	background?:mve.TValue<string>,
	children?:JOChildren<UAllView,Node>
}


export const viewBuilder:VBuilder<UView,Node>=function(getAllBuilder,allParse){

	return parseOf(function(me,child){
		const element=document.createElement("div")
		element.style.userSelect="none"
		buildAbs(me,element,child)
		if(child.background){
			parseUtil.bind(me,child.background,function(v){
				element.style.background=v
			})
		}
		const childResult=child.children?allParse.children(me,new DOMVirtualParam(element),child.children):null
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
	})
}