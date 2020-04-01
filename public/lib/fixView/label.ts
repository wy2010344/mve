import { mve } from "../mve/util";
import { VBuilder } from "./index";
import { parseOf, parseUtil } from "../mve/index";
import { buildAbs, UAbsView } from "./util";


export interface ULabel extends UAbsView{
	type:"label",
	color?:mve.TValue<string>,
	text:mve.TValue<string>
}


export const labelBuilder:VBuilder<ULabel,HTMLElement>=function(getAllBuilder,allParse){
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
		return{
			element,
			init(){},
			destroy(){}
		}
	})
}