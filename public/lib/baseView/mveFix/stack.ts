import { CAbsView, BViewVirtualParam} from "./util";
import { CChildType } from "../mve/childrenBuilder";
import { CAllView, VBuilder } from "./index";
import { BAbsView, BView, BStack, BStackVirtualParam, BStackItem } from "../index";
import { parseOf, parseUtil } from "../mve/index";




export interface CStackItem{
  children:CChildType<CAllView,BAbsView>[]
}

export interface CStack extends CAbsView{
  type:"stack",
  children:CChildType<CStackItem,BStackItem>[]
}

export const stackBuilder:VBuilder<CStack,BView>=function(getAllBuilder,allParse){
  const parseStackItem=parseOf<CStackItem,BStackItem>(function(me,child){
    const stackItem=new BStackItem()
    const childResult=allParse.children(me,new BViewVirtualParam(stackItem.view),child.children)
    return {
      element:stackItem,
      destroy(){
        childResult.destroy()
      }
    }
  })
  return parseOf(function(me,child){
    const stack=new BStack(me)
    if(child.x){
      parseUtil.bind(me,child.x,function(v){
        stack.view.kSetX(v)
      })
    }
    if(child.y){
      parseUtil.bind(me,child.y,function(v){
        stack.view.kSetY(v)
      })
    }
    parseUtil.bind(me,child.w,function(v){
      stack.width(v)
    })
    parseUtil.bind(me,child.h,function(v){
      stack.height(v)
    })
    if(child.background){
      parseUtil.bind(me,child.background,function(v){
        stack.view.setBackground(v)
      })
    }
    const childResult=parseStackItem.children(me,new BStackVirtualParam(stack),child.children)
    return {
      element:stack.view,
      destroy(){
        childResult.destroy()
      }
    }
  })
}