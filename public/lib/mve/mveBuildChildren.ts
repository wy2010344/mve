import childOperate = require("./childOperate");
import buildArray = require("./buildArray");
import buildView = require("./buildView");
import buildModel = require("./buildModel");
import mveParseChildrenFactory = require("./mveParseChildren");
import { EModel, XModel, LifeModel, ChildViewModel, ChildViewArrayModel, ChildNodeModel, EWithLife, AppendChild, GenerateMeType, RealBuildChildrenType, MveFun, ParseType } from "./model";


/**
 * 递归查找下一个节点
 * @param obj 
 */
function findFirstElement(obj){
  if(obj.element){
    //普通节点
    return obj.element;
  }else{
    //复合节点
    let element=obj.firstElement();
    if(element){
      return element;
    }else{
      return findFirstElement(obj.getNextObject());
    }
  }
}
const updateModelIndex=function(view:ChildViewModel,index:number){
  view.row.index(index);
};
const updateArrayData=function(view:ChildViewArrayModel,data){
  view.row.data(data);
};
export=function(util:{
  //全局无关的
	Value<T>(v:T):mve.Value<T>;
  Watcher<B,A>(v: mve.WatchParam<B,A>):{disable():void};
  generateMe:GenerateMeType
}){
    const mveParseChildren=mveParseChildrenFactory(util)
    const getOModel=function(row,i){
      return {
        data:row,
        index:util.Value(i)
      };
    };
    const getOArray=function(row,i){
      return {
        data:util.Value(row),
        index:i //因为使用复用，所以不会发生改变
      };
    };
    /**
     * 每种children的配置的
     */
    return function(p:{
      //自己的配置
      no_cache?:boolean;
      before?(pel):void;
      after?(pel):void;
      //子节点类型的元素
      removeChild(pel,el):void;
      insertChildBefore(pel,el,el_old,isMove?:boolean):void;
      appendChild:AppendChild,
      mve:MveFun,
      parse:ParseType
    }){
      /**
       * 单元素，销毁时自动从父元素脱离
       * @param child 
       * @param e 
       * @param x 
       * @param m 
       */
      const parseObject=function(child,
                                e:EModel,
                                x:XModel,
                                m:LifeModel):EWithLife{
        const obj=p.parse(p.mve,x,e,child,m);
        m.destroys.push(function(){
          p.removeChild(e.pel,obj.element);
        })
        return obj;
      };
      const p_before=p.before||mb.Function.quote.one;
      const p_after=p.after||mb.Function.quote.one;
      /**
       * 生成对应的appendChild方法
       * @param e 
       * @param obj 
       */
      function appendChildFromSetObject(obj,p_appendChild:AppendChild){
        if(obj.element){
          return function(pel,el){
            p.insertChildBefore(pel,el,obj.element);
          }
        }else{
          return function(pel,el){
            const element=findFirstElement(obj);
            if(element){
              p.insertChildBefore(pel,el,element);
            }else{
              p_appendChild(pel,el);
            }
          }
        }
      }
      function parseArrayRepeat(child,
                                e:EModel,
                                x:XModel,
                                m:LifeModel,
                                p_appendChild:AppendChild):ChildNodeModel{
        let appendChild=p_appendChild;
        const c_inits=[];
        var isInit=false;
        const bc=buildArray({
          no_cache:p.no_cache,
          build:childOperate.build(e,child.repeat,p.mve,getOArray),
          after:function(view){
            var init=childOperate.getInit(view);
            if(isInit){
              init();
            }else{
              c_inits.push(init);
            }
          },
          update_data:updateArrayData,
          destroy:childOperate.destroy,
          appendChild(view:ChildViewArrayModel){
            appendChild(e.pel,view.obj.element);
          },
          removeChild(view:ChildViewArrayModel){
            p.removeChild(e.pel,view.obj.element);
          }
        });
        const watch=util.Watcher({
          before(){
            p_before(e.pel);
          },
          exp(){
            return child.array();
          },
          after(array){
            bc.after(array);
            p_after(e.pel);
          }
        });
        m.inits.push(function(){
          mb.Array.forEach(c_inits,function(c_i){
            c_i();
          });
          isInit=true;
        });
        m.destroys.push(function(){
          watch.disable();
          bc.destroy();
        });
        let nextObject;
        return {
          m:m,
          firstElement:bc.firstElement,
          getNextObject(){
            return nextObject;
          },
          setNextObject(obj){
            nextObject=obj;
            appendChild=appendChildFromSetObject(obj,p_appendChild);
          }
        };
      }

      function parseModelRepeat(child,
                                e:EModel,
                                x:XModel,
                                m:LifeModel,
                                p_appendChild:AppendChild):ChildNodeModel{
        let appendChild=p_appendChild;
        //model属性
        const px={
          build:childOperate.build(e,child.repeat,p.mve,getOModel),
          model:child.model,
          update_index:updateModelIndex,
          init:childOperate.init,
          destroy:childOperate.destroy,
          insertChildBefore(new_view:ChildViewModel,old_view:ChildViewModel,isMove?:boolean){
            p.insertChildBefore(e.pel,new_view.obj.element,old_view.obj.element,isMove);
          },
          removeChild(view:ChildViewModel){
            p.removeChild(e.pel,view.obj.element);
          },
          appendChild(view:ChildViewModel,isMove?:boolean){
            appendChild(e.pel,view.obj.element,isMove);
          }
        };

        var bm;
        if(mb.Array.isArray(child.model)){
          bm=buildView(px);
          if(child.id){
            if(m.k[child.id]){
              mb.log(child.id+"该id已经存在，出错");
            }else{
              m.k[child.id]=bm.view;
            }
          }
        }else{
          bm=buildModel(px);
        }
        m.inits.push(bm.init);
        m.destroys.push(bm.destroy);
        let nextObject;
        return {
          m:m,
          firstElement:bm.firstElement,
          getNextObject(){
            return nextObject;
          },
          setNextObject(obj){
            nextObject=obj;
            appendChild=appendChildFromSetObject(obj,p_appendChild);
          }
        };
      }
      /**
       * buildChildren会直接appendChild，
       * @param child 
       * @param e 
       * @param x 
       * @param o 
       * @param p_appendChild 
       */
      function parseMultiIf(child,
                            e:EModel,
                            x:XModel,
                            m:LifeModel,
                            p_appendChild:AppendChild):ChildNodeModel{
        let currentObject;
        let initFlag=false;

        const keep={
          appendChild:p_appendChild
        };
        x.watch({
          exp(){
            return child.render();
          },
          after(json){
            if(typeof(json)=='object'){
              var mveChildren=mveParseChildren(function(me){
                return {
                  elements:json
                }
              });
            }else{
              var mveChildren=mveParseChildren(json);
            }
            const obj=mveChildren(e,realBuildChildren,keep);
            if(currentObject){
              if(initFlag){
                currentObject.destroy();
                obj.init();
              }
            }
            currentObject=obj;
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
        let nextObject;
        return {
          m,
          firstElement(){
            return currentObject.firstElement()
          },
          getNextObject(){
            return nextObject;
          },
          setNextObject(obj){
            nextObject=obj;
            keep.appendChild=appendChildFromSetObject(obj,p_appendChild);
          }
        }
      }
      /**
       * 真实的组装子节点
       * @param g 
       * @param e 
       * @param x 
       * @param children 
       * @param m 
       * @param appendChild 默认的追加方式
       */
      const realBuildChildren:RealBuildChildrenType=function(
                                e:EModel,
                                x:XModel,
                                children,
                                m:LifeModel,
                                appendChild:AppendChild){
        let i=0;
        let firstChild:EWithLife|ChildNodeModel|null=null;
        let lastObject:EWithLife|ChildNodeModel|null=null;
        const length=children.length;
        while(i<length){
          const child=children[i];
          i++;
          let thisObject:EWithLife|ChildNodeModel;
          if(child.array && child.repeat){
            thisObject=parseArrayRepeat(child,e,x,m,appendChild)
          }else
          if(child.model && child.repeat){
            thisObject=parseModelRepeat(child,e,x,m,appendChild)
          }else
          if(child.multi && child.render){
            thisObject=parseMultiIf(child,e,x,m,appendChild);
          }else{
            const obj=parseObject(child,e,x,m);
            appendChild(e.pel,obj.element);
            thisObject=obj;
          }
          if(lastObject && 'setNextObject' in lastObject){
            lastObject.setNextObject(thisObject);
          }
          m=thisObject.m;
          if(!firstChild){
            firstChild=thisObject;
          }
          lastObject=thisObject;
        }
        return {
          firstElement(){
            if(firstChild){
              return findFirstElement(firstChild);
            }
          },
          firstChild,
          m:m,
        };
      }
      return function(e:EModel,
                      x:XModel,
                      children,
                      m:LifeModel){
        if(children){
          if(mb.Array.isArray(children)){
            const cd=realBuildChildren(e,x,children,m,p.appendChild);
            return cd.m;
          }else{
            //兼容原来的
            mb.log("将要淘汰，请使用列表式的children和me.repeat",children);
            let newChildren=[];
            if(children.before){
              newChildren=newChildren.concat(children.before);
            }
            newChildren.push(children)
            if(children.after){
              newChildren=newChildren.concat(children.after);
            }
            const cd=realBuildChildren(e,x,newChildren,m,p.appendChild);
            return cd.m;
          }
        }else{
          return m;
        }
      }
    }
}