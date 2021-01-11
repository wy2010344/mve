import { VirtualChild } from "./virtualTreeChildren";
import { JOChildFun, JOChildren } from "./childrenBuilder";
import { mve,BuildResult, onceLife, orInit, orDestroy } from "./util";
/**
 * 子元素集片段是动态生成的，watchAfter后直接新入
 * @param fun 
 */
export function ifChildren<JO,EO>(
  fun:(me:mve.LifeModel)=>JOChildren<JO,EO>|null
):JOChildFun<JO,EO>{
  return function(buildChildren,parent){
    let currentObject:BuildResult|null
    let virtualChild:VirtualChild<EO>|null
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
    const w=mve.WatchExp(function(){
        if(currentLifeModel){
          currentLifeModel.destroy()
        }
        currentLifeModel=mve.newLifeModel()
      },
      function(){
        return fun(currentLifeModel.me)
      },
      function(children){
        if(virtualChild){
          parent.remove(0)
          virtualChild=null
        }
        if(currentObject){
          if(life.isInit){
            orDestroy(currentObject)
          }
          currentObject=null
        }
        if(children){
          //初始化
          virtualChild=parent.newChildAtLast()
          currentObject=buildChildren(currentLifeModel.me,children,virtualChild)
          if(life.isInit){
            orInit(currentObject)
          }
        }
      }
    )
    return life.out
  }
}