import { VBuilder, CAllView, CPureView } from "./index";
import { mve } from "../../mve/util";
import { BView, BList, BAbsView, BListItem, BListVirtualParam, BScrollList, BScrollListVirtualParam } from "../index";
import { parseOf, parseUtil } from "../mve/index";
import { CChildType } from "../mve/childrenBuilder";
import { BViewVirtualParam, CAbsView, buildAbs } from "./util";


/**
 * 只能放在绝对容器里面
 */

export interface CListItem{
  height:mve.TValue<number>,
  children:CChildType<CPureView,BAbsView>[]
}
export interface CList{
  type:"list",
  x?:mve.TValue<number>,
  y?:mve.TValue<number>,
  w:mve.TValue<number>,
  children:CChildType<CListItem,BListItem>[]
}

export const listItemBuilder:VBuilder<CListItem,BListItem>=function(getAllBuilder,allParse){
  return parseOf<CListItem,BListItem>(function(me,child){
    const element=new BListItem()
    parseUtil.bind(me,child.height,function(v){
      element.height(v)
    })
    const childResult=allParse.children(me,new BViewVirtualParam(element.view),child.children)
    return {
      element,
      destroy(){
        childResult.destroy()
      }
    }
  })
}

export const listBuilder:VBuilder<CList,BView>=function(getAllBuilder,allParse){
  return parseOf(function(me,child){
    const list=new BList(me)
    if(child.x){
      parseUtil.bind(me,child.x,function(v){
        list.view.kSetX(v)
      })
    }
    if(child.y){
      parseUtil.bind(me,child.y,function(v){
        list.view.kSetY(v)
      })
    }
    parseUtil.bind(me,child.w,function(v){
      list.width(v)
    })
    const childResult=getAllBuilder().listItem.children(me,new BListVirtualParam(list),child.children)
    return {
      element:list.view,
      destroy(){
        childResult.destroy()
      }
    }
  })
}

export interface CScrollList extends CAbsView{
  type:"scrollList",
  children:CChildType<CListItem,BListItem>[]
}
export const scrollListBuilder:VBuilder<CScrollList,BView>=function(getAllBuilder,allParse){
  return parseOf(function(me,child){
    const list=new BScrollList(me)	
    if(child.x){
      parseUtil.bind(me,child.x,function(v){
        list.outView.kSetX(v)
      })
    }
    if(child.y){
      parseUtil.bind(me,child.y,function(v){
        list.outView.kSetY(v)
      })
    }
    parseUtil.bind(me,child.w,function(v){
      list.width(v)
    })
    parseUtil.bind(me,child.h,function(v){
      list.height(v)
    })
    const childResult=getAllBuilder().listItem.children(me,new BScrollListVirtualParam(list),child.children)
    return {
      element:list.outView,
      destroy(){
        childResult.destroy()
      }
    }
  })
}