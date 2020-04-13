import { CAbsView, buildAbs } from "./util";
import { mve } from "../../mve/util";
import { BLable } from "../index";
import { parseOf, parseUtil } from "../mve/index";
import { VBuilder } from "./index";






export interface CLabel extends CAbsView{
  type:"label",
  text:mve.TValue<string>,
  color?:string
}

export const labelBuilder:VBuilder<CLabel,BLable>=function(getAllBuilder,allParse){
  return parseOf(function(me,child){
    const element=new BLable()
    buildAbs(me,element,child)
    parseUtil.bind(me,child.text,function(v){
      element.setText(v)
    })
    return {
      element,
      destroy(){

      }
    }
  })
}