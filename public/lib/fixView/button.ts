import { UAbsView, buildAbs } from "./util";
import { mve } from "../mve/util";
import { VBuilder } from "./index";
import { parseOf, parseUtil } from "../mve/index";






export interface UButton extends UAbsView{
	type:"button",
	color?:mve.TValue<string>,
	background?:mve.TValue<string>
	text:mve.TValue<string>,
	click():void
}

export const buttonBuilder:VBuilder<UButton,HTMLElement>=function(getAllBuilder,allParse){
	return parseOf(function(me,child){
		const element=document.createElement("div")
		buildAbs(me,element,child)
		parseUtil.bind(me,child.text,function(v){
			element.innerText=v
		})
		if(child.color){
			parseUtil.bind(me,child.color,function(v){
				element.style.color=v
			})
		}		
		if(child.background){
			parseUtil.bind(me,child.background,function(v){
				element.style.background=v
			})
		}
		element.style.cursor="pointer"
		mb.DOM.addEvent(element,"click",child.click)
		return{
			element,
			init(){},
			destroy(){}
		}
	})
}