import { VBuilder } from "./index";
import { parseOf } from "../../mve/index";





export interface MSpan{
  type:"span",
  
}
export const spanBuilder:VBuilder<MSpan,HTMLSpanElement>=function(getAllBuilder,allParse){


  return parseOf(function(me,child){
    const element=document.createElement("span")

    return {
      element,
      init(){

      },
      destroy(){

      }
    }
  })
}