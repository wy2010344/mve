import { viewBuilder, CView } from "./view";
import { ParseOfResult, parseOf } from "../mve/index";
import { BAbsView } from "../index";
import { CLabel, labelBuilder } from "./label";
import { CButton } from "./button";
import { buttonBuilder } from "./button";
import { CList, listBuilder, listItemBuilder, scrollListBuilder, CScrollList } from "./list";
import { CGrid, gridBuilder } from "./grid";
import { CStack, stackBuilder } from "./stack";



export type CPureView=CView
|CLabel
|CButton
export type CAllView=CPureView
|CList
|CScrollList
|CGrid
|CStack


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
  export const scrollList=scrollListBuilder(getAllBuilder,allParse)
  export const listItem=listItemBuilder(getAllBuilder,allParse)
  export const grid=gridBuilder(getAllBuilder,allParse)
  export const stack=stackBuilder(getAllBuilder,allParse)
}

export type GetAllBuilderType=typeof getAllBuilder
export interface VBuilder<MType,JType>{
  (
    getAllBuilder:GetAllBuilderType,
    allParse:ParseOfResult<CAllView,BAbsView>
  ):ParseOfResult<MType,JType>
}