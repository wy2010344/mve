import { JOFun, BuildChildrenResult, JOChildren } from "./childrenModel";
import { onceLife } from "./onceLife";
import { VirtualChild } from "./virtualTreeChildren";




export function ifChildren<JO,EO,PEO>(
  fun:(me:mve.Inner)=>JOChildren<JO,EO,PEO>
):JOFun<JO,EO,PEO>{
  return function(mx,parent){
    let currentObject:BuildChildrenResult
    let currentLifeModel:mve.LifeModel
    let virtualChild:VirtualChild<PEO,EO>

    const life=onceLife({
      init(){
        currentObject.init()
      },
      destroy(){
        w.disable()
        currentObject.destroy()
        currentLifeModel.destroy()
      }
    })
    const w=mve.Watch({
      before(){
        if(currentLifeModel){
          currentLifeModel.destroy()
        }
        currentLifeModel=mve.lifeModel()
      },
      exp(){
        return fun(currentLifeModel.me)
      },
      after(children:JOChildren<JO,EO,PEO>){
        if(virtualChild){
          parent.remove(0)
        }
        if(currentObject){
          if(life.isInit){
            currentObject.destroy()
          }
        }
        currentLifeModel=mve.lifeModel()
        virtualChild=parent.newChildAtLast()
        currentObject=mx.buildChildren(currentLifeModel.me,children,virtualChild)
        if(life.isInit){
          currentObject.init()
        }
      }
    })
    return life
  }
}