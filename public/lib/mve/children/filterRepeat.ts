import { childrenRender, RealBuildChildrenType, FakeE, GenerateMeType, ChildNodeItem } from "../model";
import { deepRun } from "./util";
import { dealChildResult } from "../mveParseChildFactory";



export function buildRepeat(util:{
  Watcher<B,A>(v: mve.WatchParam<B,A>):{disable():void}; 
  generateMe:GenerateMeType,
  forEachRun(array:any[]):void
}):childrenRender{
  return function(child,e,x,m,p_appendChild,mx){
    const keep={
      appendChild:p_appendChild
    };
    let isInit=false //是否已贴上界面
    const views:ReturnType<RealBuildChildrenType>[]=[];
    let lastme,lastM;
    const watch=util.Watcher({
      before(){
        mx.before(e.pel);
      },
      exp(){
        return child.array();
      },
      after(array:any[]){
        const gm=util.generateMe()
        if(lastme){
          //生命周期销毁，单个
          lastme.destroy()
        }
        lastme=gm
        let newM={
          k:{},
          inits:[],
          destroys:[]
        }
        if(lastM){
          //如果已经初始化，对上一个的进行销毁
          if(isInit){
            util.forEachRun(lastM.destroys)
          }else{
            lastM.destroys.length=0
          }
        }
        lastM=newM
  
        //旧节点从父元素上移除
        mb.Array.forEach(views,function(view){
          deepRun(view.views,function(el){
            el.remove()
          })
        })
        views.length=0;
  
        //初始化
        mb.Array.forEach(array,function(row,index){
          const dr=dealChildResult(child.repeat(gm.me,row,index))
          const view=mx.realBuildChildren(e,gm.life,dr.elements,newM,keep.appendChild)
          newM=view.m
          newM.inits.push(dr.init)
          newM.destroys.push(dr.destroy)
          views.push(view)
          deepRun(view.views,function(el){
            keep.appendChild(e.pel,el.element);
          })
        })
        if(isInit){
          //初始化之后，内部初始化
          util.forEachRun(newM.inits)
        }
        mx.after(e.pel);
      }
    });
    m.inits.push(function() {
      isInit=true
      util.forEachRun(lastM.inits);
    })
    m.destroys.push(function() {
      watch.disable();
      lastme.destroy()
      util.forEachRun(lastM.destroys)
    })
    let nextObject:ChildNodeItem
    return {
      m:m,
      firstElement(){
        const view=views[0]
        if(view){
          return view.firstElement()
        }
      },
      getNextObject(){
        return nextObject;
      },
      deepRun(fun){
        for(let i=0;i<views.length;i++){
          deepRun(views[i].views,fun)
        }
      },
      setNextObject(obj){
        nextObject=obj;
        keep.appendChild=mx.appendChildFromSetObject(obj,p_appendChild);
      }
    };
  }
}