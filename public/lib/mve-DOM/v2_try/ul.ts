import { VBuilder, AllMType } from "./index";
import { parseOf } from "../../mve/index";
import { DOMVirtualParam } from "./util";
import { JOChildType } from "../../mve/childrenBuilder";


export interface MLi{
  type:"li",
  children?:JOChildType<AllMType,HTMLElement>
}

export interface MUl{
  type:"ul",

  children?:JOChildType<MLi,HTMLLIElement>
}
export const ulBuilder:VBuilder<MUl,HTMLUListElement>=function(getAllBuilder,allParse){

  const liParse=parseOf<MLi,HTMLLIElement>(function(me,child){
    const element=document.createElement("li")
    const childrenResult=child.children?allParse.children(me,new DOMVirtualParam(element),child.children):null
    return{
      element,
      init(){

      },
      destroy(){

      }
    }
  })
  return parseOf(function(me,child){
    const element=document.createElement("ul")

    const childrenResult=child.children?liParse.children(me,new DOMVirtualParam(element),child.children):null
    return {
      element,
      init(){
        if(childrenResult){
          childrenResult.init()
        }
      },
      destroy(){
        if(childrenResult){
          childrenResult.destroy()
        }
      }
    }
  })
}