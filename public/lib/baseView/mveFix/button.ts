import { CAbsView, buildAbs } from "./util";
import { mve } from "../../mve/util";
import { BButton } from "../index";
import { parseOf, parseUtil } from "../mve/index";
import { VBuilder } from "./index";






export interface CButton extends CAbsView{
  type:"button",
  text:mve.TValue<string>,
  color?:string,
  click:()=>void
}

export const buttonBuilder:VBuilder<CButton,BButton>=function(getAllBuilder,allParse){
  return parseOf(function(me,child){
    const element=new BButton()
    buildAbs(me,element,child)
    parseUtil.bind(me,child.text,function(v){
      element.setText(v)
    })
    element.setClick(child.click)
    return {
      element,
      destroy(){ }
    }
  })
}