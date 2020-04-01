import { mve } from "../mve/util";
import { VBuilder } from "./index";
import { parseOf, parseUtil } from "../mve/index";
import { buildAbs, UAbsView } from "./util";


export interface UInput extends UAbsView{
	type:"input",
	id?(v:HTMLInputElement):void,
	value?:mve.TValue<string>
}


export const inputBuilder:VBuilder<UInput,HTMLElement>=function(getAllBuilder,allParse){
	return parseOf(function(me,child){
		const element=document.createElement("input")
		buildAbs(me,element,child)
		if(child.id){
			child.id(element)
		}
		if(child.value){
			parseUtil.bind(me,child.value,function(v){
				element.value=v
			})
		}
		return{
			element,
			init(){},
			destroy(){}
		}
	})
}