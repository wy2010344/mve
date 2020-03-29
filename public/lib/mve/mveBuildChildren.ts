
import { EModel, XModel, LifeModel, ChildViewModel, ChildViewArrayModel,
         ChildNodeModel, AppendChild, GenerateMeType, 
         RealBuildChildrenType, MveFun, ParseType, MultiParseResultItem, ChildNodeItem, EWithLifeRemove, FakeE, MveParseChildrenType, InsertChildBefore, childrenRender } from "./model";
import { findFirstElement, deepRun } from "./children/util";



export function superBuildChildrenFactory(
  mveParseChild:MveParseChildrenType,
  whenNoType:(child:any)=>any 
){
  return function(p:{
    before?(pel:FakeE):void;
    after?(pel:FakeE):void;
    removeChild(pel:FakeE,el:FakeE):void;
    insertChildBefore:InsertChildBefore
    appendChild:AppendChild,
    mve:MveFun,
    parse:ParseType
  }){

    const p_before=p.before||mb.Function.quote.one;
    const p_after=p.after||mb.Function.quote.one;
    /**
     * 生成对应的appendChild方法
     * @param e 
     * @param obj 
     */
    function appendChildFromSetObject(obj: ChildNodeItem,
      p_appendChild: AppendChild) {
      if ('element' in obj) {
        return function (pel: FakeE, el: FakeE) {
          p.insertChildBefore(pel, el, obj.element);
        }
      } else {
        return function (pel: FakeE, el: FakeE) {
          const element = findFirstElement(obj);
          if (element) {
            p.insertChildBefore(pel, el, element);
          } else {
            p_appendChild(pel, el);
          }
        }
      }
    }

    function buildChildrenOf(e: EModel, repeat, getO, keep: { appendChild: AppendChild }) {
      return function (row, i) {
        const o = getO(row, i);
        const obj = mveParseChild(function (me) {
          /*相当于修饰*/
          return repeat(me, o.data, o.index);
        })(e, realBuildChildren, keep);
        return {
          row: o,
          obj: obj
        };
      };
    }
    /**
    * 单元素，销毁时自动从父元素脱离
    * @param child 
    * @param e 
    * @param x 
    * @param m 
    */
    const parseObject = function (child,
      e: EModel,
      x: XModel,
      m: LifeModel): EWithLifeRemove {
      const obj = p.parse(p.mve, x, e, child, m) as EWithLifeRemove;
      obj.remove = function () {
        p.removeChild(e.pel, obj.element);
      }
      return obj;
    };
    /**
    * 真实的组装子节点
    * 返回元素列表，手动决定组合
    * @param g 
    * @param e 
    * @param x 
    * @param children 
    * @param m 
    * @param appendChild 默认的追加方式
    */
    const realBuildChildren: RealBuildChildrenType = function (
      e: EModel,
      x: XModel,
      children,
      m: LifeModel,
      appendChild: AppendChild) {
      let i = 0;
      const views: (ChildNodeItem)[] = []
      let lastObject: ChildNodeItem | null = null;
      const length = children.length;
      while (i < length) {
        let child = children[i];
        i++;
        let thisObject: ChildNodeItem;
        /*
        if(child.array && child.repeat){
        if(child.isNew){
        thisObject=parseArrayRepeat(child,e,x,m,appendChild)
        }else{
        thisObject=parseArrayRepeat_old(child,e,x,m,appendChild)
        }
        }else
        if(child.model && child.repeat){
        thisObject=parseModelRepeat(child,e,x,m,appendChild)
        }else
        if(child.multi && child.render){
        thisObject=parseMultiIf(child,e,x,m,appendChild);
        }
        */
        let ctype = child.type
        if(!ctype && child.repeat){
          child= whenNoType(child)//需要兼容
          ctype=child.type
        }
        if (typeof (ctype) == 'function') {
          thisObject = ctype(child, e, x, m, appendChild,mxv) as ChildNodeModel
        } else {
          const obj = parseObject(child, e, x, m);
          thisObject = obj;
        }
        if (lastObject && 'setNextObject' in lastObject) {
          lastObject.setNextObject(thisObject);
        }
        m = thisObject.m;
        views.push(thisObject);
        lastObject = thisObject;
      }
      return {
        firstElement() {
          if (views.length != 0) {
            return findFirstElement(views[0]);
          }
        },
        views,
        m: m,
      };
    }
    const mxv={
      before:p_before,
      after:p_after,
      realBuildChildren,
      buildChildrenOf,
      parseObject,
      appendChildFromSetObject,
      insertChildBefore:p.insertChildBefore
    };
    return function(e: EModel,
      x: XModel,
      children,
      m: LifeModel){
        if (children) {
          if (mb.Array.isArray(children)) {
            var newChildren = children;
          } else {
            //兼容原来的
            var newChildren = [];
            if (children.before || children.after) {
              mb.log("将要淘汰，使用before和after的方式", children);
            }
            if (children.before) {
              newChildren = newChildren.concat(children.before);
            }
            newChildren.push(children)
            if (children.after) {
              newChildren = newChildren.concat(children.after);
            }
          }
          const cd = realBuildChildren(e, x, newChildren, m, p.appendChild);
          deepRun(cd.views, function (el) {
            p.appendChild(e.pel, el.element);
          });
          /*
          //可以不用，移除父节点不需要再移除孙子结点
          cd.m.destroys.push(function(){
          deepRun(cd.views,function(el){
          el.remove()
          })
          })
          */
          return cd.m;
        } else {
          return m;
        }
    }
  }
}