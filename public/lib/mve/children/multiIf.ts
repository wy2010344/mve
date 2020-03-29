import { childrenRender, RealBuildChildrenType, ChildNodeItem, MultiParseResultItem, FakeE, MveParseChildrenType, AppendChildFromSetObjectType } from "../model";
import { deepRun } from "./util";






export function buildMultiIf(mveParseChild:MveParseChildrenType):childrenRender{
  return function(child,e,x,m,p_appendChild,mx){
    let currentObject:MultiParseResultItem;
    let initFlag=false;
    const keep={
      appendChild:p_appendChild
    };
    x.watch({
      before(){
        mx.before(e.pel)
      },
      exp(){
        return child.render();
      },
      after(json){
        if(currentObject){
          //先自制销毁
          if(initFlag){
            currentObject.destroy()
          }
          //移除节点
          deepRun(currentObject.views,function(e){
            e.remove()
          })
        }
        if(json){
          //如果有返回值
          if(typeof(json)=='object'){
            var mveChildren=mveParseChild(function(me){return json});
          }else{
            var mveChildren=mveParseChild(json);
          }
          const obj=mveChildren(e,mx.realBuildChildren,keep);
          deepRun(obj.views,function(el){
            keep.appendChild(e.pel,el.element);
          })
          if(initFlag){
            obj.init()
          }
          currentObject=obj;
        }else{
          currentObject=null
        }
        mx.after(e.pel);
      }
    })
    m.inits.push(function(){
      initFlag=true;
      if(currentObject && currentObject.init){
        currentObject.init();
      }
    })
    m.destroys.push(function(){
      if(currentObject && currentObject.destroy){
        currentObject.destroy();
      }
    })
    let nextObject:ChildNodeItem;
    return {
      m,
      firstElement(){
        if(currentObject){
          return currentObject.firstElement()
        }else{
          if('firstElement' in nextObject){
            return nextObject.firstElement()
          }else{
            return nextObject.element
          }
        }
      },
      getNextObject(){
        return nextObject;
      },
      deepRun(fun){
        if(currentObject){
          deepRun(currentObject.views,fun);
        }
      },
      setNextObject(obj){
        nextObject=obj;
        keep.appendChild=mx.appendChildFromSetObject(obj,p_appendChild);
      }
    }
  }
}