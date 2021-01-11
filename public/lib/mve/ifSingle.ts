import { SingleTargetFun } from "./singleModel";
import { BuildResult, mve, onceLife, orDestroy, orInit } from "./util";
/**
 * 子元素集是动态生成的，watchAfter后直接新入
 * @param fun 
 */
export function ifSingle<JO,EO>(
  fun:(me:mve.LifeModel)=>JO|null
):SingleTargetFun<JO,EO>{
  return function(buildSingle,set){
    let currentObject:BuildResult|null
    let currentLifeModel:mve.LifeModelReturn
    const life=onceLife({
      init(){
        if(currentObject){
          orInit(currentObject)
        }
      },
      destroy(){
        w.disable()
        if(currentObject){
          orDestroy(currentObject)
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
      function(target:JO){
        if(currentObject){
          //销毁
          if(life.isInit){
            orDestroy(currentObject)
          }
          set(null)
          currentObject=null
        }
        if(target){
          //初始化
          currentObject=buildSingle(currentLifeModel.me,target,set)
          if(life.isInit){
            orInit(currentObject)
          }
        }
      }
    )
    return life.out
  }
}