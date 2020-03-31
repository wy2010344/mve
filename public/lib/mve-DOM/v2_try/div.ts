import { VBuilder, AllMType } from "./index";
import { parseOf, parseUtil } from "../../mve/index";
import { JOChildren } from "../../mve/childrenBuilder";
import DOM = require("../DOM");
import { DOMVirtualParam, ItemMap, StringMap, ItemValue } from "./util";
import { mve } from "../../mve/util";






export interface MDiv{
  type:"div";
	id?:(o:HTMLDivElement)=>void;
	attr?: ItemMap;
	style?: StringMap;
	text?: ItemValue;
	prop?:{ [key: string]:mve.TValue<string|number|boolean>};
	action?: { [key: string]: ((e: Event) => void) };
	children?:JOChildren <AllMType,HTMLElement>
}



export const divBuilder:VBuilder<MDiv,HTMLDivElement>=function(getAllBuilder,allParse){

  return parseOf(function(me,child){
    const element=document.createElement("div")
		if(child.id){
			child.id(element)
    }
    if(child.text){
      parseUtil.bind(me,child.text,function(v){
        DOM.text(element,v)
      })
    }
    if(child.style){
      parseUtil.bindKV(me,child.style,function(k,v){
        DOM.style(element,k,v)
      })
    }
		if(child.attr){
			parseUtil.bindKV(me,child.attr,function(k,v){
				DOM.attr(element,k,v)
			})
		}
		if(child.prop){
			parseUtil.bindKV(me,child.prop,function(k,v){
				DOM.prop(element,k,v)
			})
		}
		if(child.action){
			mb.Object.forEach(child.action,function(v,k){
				DOM.action(element,k,v)
			})
    }
    const childResult=child.children?allParse.children(me,new DOMVirtualParam(element),child.children):null
    return {
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