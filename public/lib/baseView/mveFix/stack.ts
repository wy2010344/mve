import { CAbsView, buildAbs, BViewVirtualParam, BArrayVirtualParam } from "./util";
import { CChildType } from "../mve/childrenBuilder";
import { CAllView, VBuilder } from "./index";
import { BAbsView, BView } from "../index";
import { parseOf, parseUtil } from "../mve/index";
import { BStack } from "../BNavigationView";




export interface CStackItem{
  children:CChildType<CAllView,BAbsView>[]
}

export interface CStack extends CAbsView{
  type:"stack",
  children:CChildType<CStackItem,BView>[]
}

export const stackBuilder:VBuilder<CStack,BView>=function(getAllBuilder,allParse){
  const parseStackItem=parseOf<CStackItem,BView>(function(me,child){
    const element=new BView()
    const childResult=allParse.children(me,new BViewVirtualParam(element),child.children)
    return {
      element,
      destroy(){
        childResult.destroy()
      }
    }
  })
  return parseOf(function(me,child){
    const element=new BView()
    const stack=new BStack(me,element)
    parseUtil.bind(me,child.x,function(v){
      element.kSetX(v)
    })
    parseUtil.bind(me,child.y,function(v){
      element.kSetY(v)
    })
    parseUtil.bind(me,child.w,function(v){
      element.kSetW(v)
    })
    parseUtil.bind(me,child.h,function(v){
      element.kSetH(v)
    })
    if(child.background){
      parseUtil.bind(me,child.background,function(v){
        element.setBackground(v)
      })
    }
    const childResult=parseStackItem.children(me,new BArrayVirtualParam(stack),child.children)
    return {
      element,
      destroy(){
        childResult.destroy()
      }
    }
  })
}