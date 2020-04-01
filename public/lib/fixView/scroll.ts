import { UAbsView, buildAbs } from "./util";
import { mve } from "../mve/util";
import { JOChildren } from "../mve/childrenBuilder";
import { UAllView } from "./index";
import { VBuilder } from "./index";
import { parseOf, parseUtil } from "../mve/index";
import { DOMVirtualParam } from "../mve-DOM/index";



export interface UScroll extends UAbsView{
	type:"scroll",
	sw:mve.TValue<number>,
	sh:mve.TValue<number>,
	background?:mve.TValue<string>,
	children?:JOChildren<UAllView,Node>
}

export const scrollBuilder:VBuilder<UScroll,Node>=function(getAllBuilder,allParse){
	return parseOf(function(me,child){
		const element=document.createElement("div")
		buildAbs(me,element,child)
		element.style.overflow="auto"
		const innerS=document.createElement("div")
		element.appendChild(innerS)
		parseUtil.bind(me,child.sw,function(v){
			innerS.style.width=v+"px"
		})
		parseUtil.bind(me,child.sh,function(v){
			innerS.style.height=v+"px"
		})		
		if(child.background){
			parseUtil.bind(me,child.background,function(v){
				innerS.style.background=v
			})
		}
		const childResult=child.children?allParse.children(me,new DOMVirtualParam(innerS),child.children):null
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