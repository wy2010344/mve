import { ChildNodeItem, EWithLifeRemove } from "../model";

/**
 * 递归查找下一个节点
 * @param obj 
 */
export function findFirstElement(obj:ChildNodeItem){
  if('element' in obj){
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
/**从列表中选择 */
export function findFirstElementArray(vs:ChildNodeItem[]){
  let i=0;
  let el=null;
  while(i<vs.length && el==null){
    el=findFirstElement(vs[i]);
    i++;
  }
  return el;
}
/**深度遍历虚拟操作元素树*/
export function deepRun(vs:ChildNodeItem[],fun:(e:EWithLifeRemove)=>void){
  for(let i=0;i<vs.length;i++){
    let v=vs[i];
    if('element' in v){
      fun(v);
    }else{
      v.deepRun(fun);
    }
  }
}