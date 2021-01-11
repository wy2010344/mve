import { BParam, BParamImpl } from "../index"
import { CChildFun, CChildType, CResult } from "./childrenBuilder";
import { mve } from "../../mve/util";
import { VirtualChild } from "../../mve/virtualTreeChildren";




class ViewModel<EO>{
  constructor(
    public readonly index:mve.Value<number>,
    public readonly param:BParamImpl,
    public readonly element:VirtualChild<EO>,
    public readonly result:CResult
  ){}
  destroy(){
    this.param.destroy()
    this.result.destroy()
  }
}

export function modelChildren<T,JO,EO>(
  model:mve.ArrayModel<T>,
  fun:(me:BParam,row:T,index:()=>number)=>CChildType<JO,EO>[]
):CChildFun<JO,EO>{

  return function(mx,parent){
    const views:ViewModel<EO>[]=[] 
    const theView:mve.ArrayModelView<T>={
      insert(index,row){
        const vindex=mve.valueOf(index)
        const param=new BParamImpl()
        const cs=fun(param,row,vindex)
        const vm=parent.newChildAt(index)
        const vx=mx.buildChildren(param,cs,vm)
        const view=new ViewModel(vindex,param,vm,vx)
        views.splice(index,0,view)
        for(let i=index+1;i<views.length;i++){
          views[i].index(i)
        }
      },
      remove(index){
        const view=views.splice(index,1)[0]
        if(view){
          parent.remove(index)
          for(let i=index;i<views.length;i++){
            views[i].index(i)
          }
          view.destroy()
        }
      },
      move(oldIndex,newIndex){
        const view=views[oldIndex]
        views.splice(oldIndex,1)
        views.splice(newIndex,0,view)
        parent.move(oldIndex,newIndex)
        const sort=oldIndex<newIndex?[oldIndex,newIndex]:[newIndex,oldIndex];
        for(let i=sort[0];i<=sort[1];i++){
          views[i].index(i)
        }
      }
    }
    model.addView(theView)
    return {
      destroy(){
        for(let i=0;i<views.length;i++){
          views[i].destroy()
        }
        model.removeView(theView)
        views.length=0
      }
    }
  }
}