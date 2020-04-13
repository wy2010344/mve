import { viewBuilder, CView } from "./view";
import { ParseOfResult, parseOf } from "../mve/index";
import { BAbsView } from "../index";
import { CLabel, labelBuilder } from "./label";
import { CButton } from "./button";
import { buttonBuilder } from "./button";
import { CList, listBuilder } from "./list";




export type CAllView=CView
|CLabel
|CButton
|CList


function getAllBuilder(){
  return allBuilder
}
const allParse=parseOf<CAllView,BAbsView>(function(me,child){
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
  export const button=buttonBuilder(getAllBuilder,allParse)
  export const list=listBuilder(getAllBuilder,allParse)
}

export type GetAllBuilderType=typeof getAllBuilder
export interface VBuilder<MType,JType>{
  (
    getAllBuilder:GetAllBuilderType,
    allParse:ParseOfResult<CAllView,BAbsView>
  ):ParseOfResult<MType,JType>
}