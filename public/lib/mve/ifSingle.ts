import { SingleTargetType, SingleTargetFun } from "./singleModel";
import { onceLife } from "./onceLife";
import { BuildResult } from "./model";
import { mve } from "./util";




export function ifSingle<JO,EO>(
  fun:(me:mve.LifeModel)=>SingleTargetType<JO>|null
):SingleTargetFun<JO,EO>{
  return function(mx,p){
    let currentObject:BuildResult|null
    let currentLifeModel:mve.LifeModelReturn
    const life=onceLife({
      init(){
        if(currentObject){
          currentObject.init()
        }
      },
      destroy(){
        w.disable()
        if(currentObject){
          currentObject.destroy()
        }
        currentLifeModel.destroy()
      }
    })
    const w=mve.WatchExp(
      function(){
        if(currentLifeModel){
          currentLifeModel.destroy()
        }
        currentLifeModel=mve.newLifeModel()
      },
      function(){
        return fun(currentLifeModel.me)
      },
      function(target:SingleTargetType<JO>){
        if(currentObject){
          //销毁
          if(life.isInit){
            currentObject.destroy()
          }
          p.remove()
          currentObject=null
        }
        if(target){
          //初始化
          currentObject=mx.buildSingle(currentLifeModel.me,target,p)
          if(life.isInit){
            currentObject.init()
          }
        }
      }
    )
    return life
  }
}