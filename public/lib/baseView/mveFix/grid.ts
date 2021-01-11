import { mve } from "../../mve/util";
import { BView, BAbsView, BGrid, BGridVirtualParam, BGridItem } from "../index";
import { CChildType } from "../mve/childrenBuilder";
import { CPureView, VBuilder, CAllView } from "./index";
import { parseOf, parseUtil } from "../mve/index";
import { BViewVirtualParam } from "./util";





export interface CGridItem{
  children:CChildType<CAllView,BAbsView>[]
}

export interface CGrid{
  type:"grid",
  cellW:mve.TValue<number>
  cellH:mve.TValue<number>
  columnNum:mve.TValue<number>
  children:CChildType<CGridItem,BGridItem>[]
}


export const gridBuilder:VBuilder<CGrid,BView>=function(getAllBuilder,allParse){
  const parseStackItem=parseOf<CGridItem,BGridItem>(function(me,child){
    const stackItem=new BGridItem()
    const childResult=allParse.children(me,new BViewVirtualParam(stackItem.view),child.children)
    return {
      element:stackItem,
      destroy(){
        childResult.destroy()
      }
    }
  })
  return parseOf(function(me,child){
    const grid=new BGrid(me)
    parseUtil.bind(me,child.cellW,function(w){
      grid.cellWidth(w)
    })
    parseUtil.bind(me,child.cellH,function(h){
      grid.cellHeight(h)
    })
    parseUtil.bind(me,child.columnNum,function(n){
      grid.columnNum(n)
    })
    const childResult=parseStackItem.children(me,new BGridVirtualParam(grid),child.children)
    return {
      element:grid.view,
      destroy(){
        childResult.destroy()
      }
    }
  })
}