import { childrenRender, ChildViewModel, ChildNodeItem, FakeE } from "../model";
import { deepRun, findFirstElementArray } from "./util";

interface MView{
	insert(index:number,row):void;
	remove(index:number):void;
	move(old_index:number,new_index:number):void;
};
/**
*
build
model
update_index(view,index);
insertChildBefore(new_view,old_view)
appendChild(view)
removeChild(view)
init(view)
destroy(view)
*/
export function buildModel(p:{
	model:{
		size():number;
		get(index:number):MView;
		addView(view:MView):void;
		removeView(view:MView):void;
	},
	build(row,index:number):any;
	update_index(view:ChildViewModel,index:number):any;
	/**将view移动到views的index，此时view已经在views中 */
	insertChild(view:ChildViewModel,views:ChildViewModel[],index:number,isMove?:boolean):void;
	init(view:ChildViewModel):void;
	destroy(view:ChildViewModel):void;
}){
	const views:ChildViewModel[]=[];
	const view:MView={
		insert(index,row){
			//动态加载
			const view=p.build(row,index);
			views.splice(index,0,view);
			for(var i=index+1;i<views.length;i++){
				p.update_index(views[i],i);
			}
			p.insertChild(view,views,index);
			p.init(view);
		},
		remove(index){
			//动态删除
			const view=views[index];
			views.splice(index,1);
			for(var i=index;i<views.length;i++){
				p.update_index(views[i],i);
			}
			p.destroy(view);
		},
		move(old_index,new_index){
			const view=views[old_index];
			views.splice(old_index,1);
			views.splice(new_index,0,view);

			const sort=old_index<new_index?[old_index,new_index]:[new_index,old_index];
			for(var i=sort[0];i<=sort[1];i++){
				p.update_index(views[i],i);
			}
			p.insertChild(view,views,new_index,true);
		}
	};
	p.model.addView(view);
	return {
		firstElement(){
			const view=views[0];
			if(view){
				return view.obj.firstElement();
			}
		},
		views:views,
		init(){
			mb.Array.forEach(views,p.init);
		},
		destroy(){
			mb.Array.forEach(views,p.destroy);
			p.model.removeView(view);
			views.length=0
		}
	};
}

const updateModelIndex=function(view:ChildViewModel,index:number){
  view.row.index(index);
};


export function buildModelRepeat(util:{
  Value(v:any):any
  forEachRun(array:any[]):void
}):childrenRender{
  const getOModel=function(row,i){
    return {
      data:row,
      index:util.Value(i)
    };
  };
  
  return function(child,e,x,m,p_appendChild,mx){
    const keep={
      appendChild:p_appendChild
    };
    let initFlag=false
    const c_inits=[];//未贴到界面上，不执行初始化。
    //model属性
    const bm=buildModel({
      build:mx.buildChildrenOf(e,child.repeat,getOModel,keep),
      model:child.model,
      update_index:updateModelIndex,
      init(view){
        if(initFlag){
          view.obj.init()
        }else{
          c_inits.push(view.obj.init)
        }
      },
      destroy(view){
        if(initFlag){
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
      insertChild(view:ChildViewModel,views:ChildViewModel[],index:number,isMove?:boolean){
        const count=views.length;
        let tmpIndex=index+1;
        if(tmpIndex<count){
          /*移动到前面*/
          let nextel=null;
          while(tmpIndex<count && nextel==null){
            nextel=findFirstElementArray(views[tmpIndex].obj.views);
            tmpIndex++;
          }
          //寻找当前集合内下一个元素
          if(nextel){
            deepRun(view.obj.views,function(el){
              mx.insertChildBefore(e.pel,el.element,nextel,isMove);
            });
          }else{
            deepRun(view.obj.views,function(el){
              keep.appendChild(e.pel,el.element,isMove);
            })
          }
        }else{
          deepRun(view.obj.views,function(el){
            keep.appendChild(e.pel,el.element,isMove);
          })
        }
      }
    });
    m.inits.push(function(){
      initFlag=true
      util.forEachRun(c_inits)
      c_inits.length=0
      bm.init()
    });
    m.destroys.push(bm.destroy);
    let nextObject:ChildNodeItem
    return {
      m:m,
      firstElement:bm.firstElement,
      deepRun(fun){
        for(let i=0;i<bm.views.length;i++){
          deepRun(bm.views[i].obj.views,fun);
        }
      },
      getNextObject(){
        return nextObject;
      },
      setNextObject(obj){
        nextObject=obj;
        keep.appendChild=mx.appendChildFromSetObject(obj,p_appendChild);
      }
    };
  }
}