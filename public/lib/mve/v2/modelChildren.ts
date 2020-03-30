import { JOChildFun, JOChildren } from "./childrenBuilder";
import { onceLife } from "./onceLife";
import { VirtualChild } from "./virtualTreeChildren";
import { BuildResult } from "./model";



export class ViewModel<EO>{
  constructor(
    public readonly index:mve.Value<number>,
    public readonly life:mve.LifeModel,
    public readonly element:VirtualChild<EO>,
    public readonly result:BuildResult
  ){}
  init(){
    this.result.init()
  }
  destroy(){
    this.life.destroy()
    this.result.destroy()
  }
}

export function modelChildren<T,JO,EO>(
  model:mve.TArrayModel<T>,
	fun:(me:mve.Inner,row:T,index:()=>number)=>JOChildren<JO,EO>
):JOChildFun<JO,EO>{
  return function(mx,parent){
    const views:ViewModel<EO>[]=[] 
    const life=onceLife({
      init(){
        for(let i=0;i<views.length;i++){
          views[i].init()
        }
      },
      destroy(){
        for(let i=0;i<views.length;i++){
          views[i].destroy()
        }
        model.removeView(theView)
        views.length=0
      }
    })
    const theView:mve.TArrayModelView<T>={
      insert(index,row){
        const vindex=mve.Value(index)
        const lifeModel=mve.lifeModel()
        const cs=fun(lifeModel.me,row,vindex)
        //创建视图
        const vm=parent.newChildAt(index)
        const vx=mx.buildChildren(lifeModel.me,cs,vm)
        const view=new ViewModel<EO>(vindex,lifeModel,vm,vx)
        //模型增加
        views.splice(index,0,view)
        //更新计数
        for(let i=index+1;i<views.length;i++){
          views[i].index(i)
        }
        //初始化
        if(life.isInit){
          view.init()
        }
      },
      remove(index){
        //模型减少
        const view=views.splice(index,1)[0]
        if(view){
          //视图减少
          parent.remove(index)
          //更新计数
          for(let i=index;i<views.length;i++){
            views[i].index(i)
          }
          //销毁
          if(life.isInit){
            view.destroy()
          }
        }
      },
      move(oldIndex,newIndex){
        const view=views[oldIndex]
        //模型变更
        views.splice(oldIndex,1)
        views.splice(newIndex,0,view)
        //视图变更
        parent.move(oldIndex,newIndex)
        //更新计数
        const sort=oldIndex<newIndex?[oldIndex,newIndex]:[newIndex,oldIndex];
        for(let i=sort[0];i<=sort[1];i++){
          views[i].index(i)
        }
      }
    }
    model.addView(theView)
    return life
  }
}