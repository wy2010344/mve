import { CAbsView, buildAbs, BViewVirtualParam } from "./util";
import { mve } from "../../mve/util";
import { BAbsView, BView } from "../index";
import { CChildType } from "../mve/childrenBuilder";
import { parseOf, parseUtil } from "../mve/index";
import { CAllView, VBuilder } from "./index";

export interface CView extends CAbsView{
  type:"view",
  children?:CChildType<CAllView,BAbsView>[]
}

export const viewBuilder:VBuilder<CView,BView>=function(getAllBuilder,allParse){

  return parseOf(function(me,child){
    const element=new BView()
    buildAbs(me,element,child)
    const childResult=child.children?allParse.children(me,new BViewVirtualParam(element),child.children):null
    return {
      element,
      destroy(){
        if(childResult){
          childResult.destroy()
        }
      }
    }
  })
}