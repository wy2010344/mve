import { AppendChild, LifeModel, EModel, XModel, ChildViewArrayModel, childrenRender, ChildNodeItem, FakeE } from "../model";
import { deepRun } from "./util";



/*
* 这个的好处，是有缓存效应。享元
*build(row,i)=>{row:{data(),index()},obj,el}
*init(value):新增的附加到父元素之后
*update_data
*destroy
*appendChild
*removeChild
*/
function buildArrayOld(p:{
	update_data(view:ChildViewArrayModel,row):void;
	destroy(view:ChildViewArrayModel):void;
	build(row,index:number):ChildViewArrayModel;
	appendChild(view:ChildViewArrayModel):void;
	init(view:ChildViewArrayModel):void;
}) {
	const views:ChildViewArrayModel[]=[];//在界面上的缓存池
	const update_views=function(array) {
		//更新视图上数据
		for(var i=0;i<views.length;i++){
			p.update_data(views[i],array[i])
		}
	};
	
	return {
		firstElement(){
			const view=views[0];
			if(view){
				return view.obj.firstElement();
			}
		},
		views:views,
		destroy(){
			mb.Array.forEach(views,p.destroy);
			//watch会执行最后一次，此时会造成reset里的二次销毁
			views.length=0
		},
		reset(array){
			if (array.length<views.length) {
				while(views.length!=array.length){
					const view=views.pop();
					p.destroy(view);
				}
				update_views(array);
			}else{               
				update_views(array);
				for(var i=views.length;i<array.length;i++){
					const view=p.build(array[i],i);
					views.push(view);
					p.appendChild(view);
					p.init(view);
				}
			}
		}
	};
}
const updateArrayData=function(view:ChildViewArrayModel,data){
  view.row.data(data);
};
export function buildFilterCacheRepeat(util:{
  Value(v:any):any
  Watcher<B,A>(v: mve.WatchParam<B,A>):{disable():void}; 
  forEachRun(vs:(()=>void)[]):void;
}):childrenRender{
  const getOArray=function(row,i){
    return {
      data:util.Value(row),
      index:i //因为使用复用，所以不会发生改变
    };
  };
  return function(child,e,x,m,p_appendChild,mx){
    const keep={
      appendChild:p_appendChild
    };
    const c_inits=[];
    var isInit=false;
    const bc=buildArrayOld({
      build:mx.buildChildrenOf(e,child.repeat,getOArray,keep),
      init(view){
        const init=view.obj.init;
        if(isInit){
          init();
        }else{
          c_inits.push(init);
        }
      },
      update_data:updateArrayData,
      destroy(view){
        if(isInit){
          view.obj.destroy()
        }else{
          const idx=c_inits.indexOf(view.obj.init)
          if(idx>-1){
            c_inits.splice(idx,1)
          }
        }
        deepRun(view.obj.views,function(el){
          el.remove()
        })
      },
      appendChild(view:ChildViewArrayModel){
        deepRun(view.obj.views,function(el){
          keep.appendChild(e.pel,el.element);
        })
      }
    });
    const watch=util.Watcher({
      before(){
        mx.before(e.pel);
      },
      exp(){
        return child.array();
      },
      after(array){
        bc.reset(array);
        mx.after(e.pel);
      }
    });
    m.inits.push(function(){
      isInit=true;
      util.forEachRun(c_inits)
      c_inits.length=0
    });
    m.destroys.push(function(){
      watch.disable();
      bc.destroy();
    });
    let nextObject:ChildNodeItem
    return {
      m:m,
      firstElement:bc.firstElement,
      getNextObject(){
        return nextObject;
      },
      deepRun(fun){
        for(let i=0;i<bc.views.length;i++){
          deepRun(bc.views[i].obj.views,fun)
        }
      },
      setNextObject(obj){
        nextObject=obj;
        keep.appendChild=mx.appendChildFromSetObject(obj,p_appendChild);
      }
    };
  }
}