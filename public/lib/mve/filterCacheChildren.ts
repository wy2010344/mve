import { JOChildFun, JOChildren } from "./childrenBuilder";
import { onceLife } from "./onceLife";
import { mve } from "./util"
import { VirtualChild } from "./virtualTreeChildren";
import { BuildResult } from "./model";




class CacheViewModel<T,EO>{
  constructor(
    public readonly row:mve.Value<T>,
    public readonly life:mve.LifeModelReturn,
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

export function filterCacheChildren<T,JO,EO>(
  array:()=>T[],
  fun:(me:mve.LifeModel,row:()=>T,index:number)=>JOChildren<JO,EO>
):JOChildFun<JO,EO>{
  return function (mx,parent){
    const views:CacheViewModel<T,EO>[]=[]
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
        views.length=0
        w.disable()
      }
    })
    const w=mve.WatchAfter(function(){
      return array()
    },function(vs){
      if(vs.length<views.length){
        //更新旧数据视图
        for(let i=0;i<vs.length;i++){
          views[i].row(vs[i])
        }
        for(let i=views.length;i>vs.length;i--){
          //删除视图
          parent.remove(i-1)
          //销毁
          if(life.isInit){
            views[i-1].destroy()
          }
        }
        views.length=vs.length
      }else{
        //更新旧数据
        for(let i=0;i<views.length;i++){
          views[i].row(vs[i])
        }
        //追加新数据
        for(let i=views.length;i<vs.length;i++){
          const row=mve.valueOf(vs[i])
          const lifeModel=mve.newLifeModel()
          const cs=fun(lifeModel.me,row,i)
          //创建视图
          const vm=parent.newChildAt(i)
          const vx=mx.buildChildren(lifeModel.me,cs,vm)
          const cv=new CacheViewModel(row,lifeModel,vm,vx)
          //模型增加
          views.push(cv)
          //初始化
          if(life.isInit){
            cv.init()
          }
        }
      }
    })
    return life
  }
}