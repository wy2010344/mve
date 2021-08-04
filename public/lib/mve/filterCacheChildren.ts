import { baseChildrenBuilder, EOChildFun, EOChildren } from "./childrenBuilder";
import { mve,onceLife, BuildResult, orInit, orDestroy } from "./util"




class CacheViewModel<T>{
  constructor(
    public readonly row:mve.Value<T>,
		private readonly life:mve.LifeModelReturn,
		private readonly result:BuildResult
  ){}
  init(){
		orInit(this.result)
  }
  destroy(){
		this.life.destroy()
		orDestroy(this.result)
  }
}

export function filterCacheChildren<T,EO>(
  array:()=>T[],
  fun:(me:mve.LifeModel,row:()=>T,index:number)=>EOChildren<EO>
):EOChildFun<EO>{
  return function(parent,me){
    const views:CacheViewModel<T>[]=[]
    const life=onceLife({
      init(){
				const size=views.size()
				for(let i=0;i<size;i++){
          views.get(i).init()
        }
      },
      destroy(){
				const size=views.size()
				for(let i=size-1;i>-1;i--){
          views.get(i).destroy()
        }
        views.length=0
        w.disable()
      }
    })
    const w=mve.WatchAfter(array,function(vs){
      if(vs.length<views.length){
        //更新旧数据视图
        for(let i=0;i<vs.length;i++){
          views[i].row(vs[i])
        }
        const minLength=vs.length-1
        for(let i=views.length-1;i>minLength;i--){
          //删除视图
          parent.remove(i)
          //销毁
          if(life.isInit){
            views[i].destroy()
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
          const vx=baseChildrenBuilder(lifeModel.me,cs,vm)
          const cv=new CacheViewModel(row,lifeModel,vx)
          //模型增加
          views.push(cv)
          //初始化
          if(life.isInit){
            cv.init()
          }
        }
      }
    })
    return life.out
  }
}