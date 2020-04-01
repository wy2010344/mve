import { JOChildren } from "../mve/childrenBuilder";
import { mve } from "../mve/util";
import { UView, viewBuilder } from "./view";
import { ULabel, labelBuilder } from "./label";
import { ParseOfResult, parseOf } from "../mve/index";
import { UInput, inputBuilder } from "./input";
import { UButton, buttonBuilder } from "./button";
import { UScroll, scrollBuilder } from "./scroll";





export type UAllView=UView
|ULabel
|UInput
|UButton
|UScroll


function getAllBuilder(){
	return allBuilder
}
const allParse=parseOf<UAllView,HTMLElement>(function(me,child){
	const builder=allBuilder[child.type]
	if(builder){
		return builder.view(me,child as any) as any
	}else{
    throw `尚不支持的type${child.type}`
	}
})
export namespace allBuilder{
	export const view=viewBuilder(getAllBuilder,allParse)
	export const label=labelBuilder(getAllBuilder,allParse)
	export const input=inputBuilder(getAllBuilder,allParse)
	export const button=buttonBuilder(getAllBuilder,allParse)
	export const scroll=scrollBuilder(getAllBuilder,allParse)
}

export type GetAllBuilderType=typeof getAllBuilder

export interface VBuilder<MType,JType>{
  (
    getAllBuilder:GetAllBuilderType,
    allParse:ParseOfResult<UAllView,Node>
  ):ParseOfResult<MType,JType>
}