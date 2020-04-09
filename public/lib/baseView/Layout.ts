import { MveUtil } from "./mveUtil";
import { SuperView } from "./arraymodel";



/**
 * 宽度相同
 * @param me 
 * @param model 
 */
export function sameWidth(me:MveUtil,model:SuperView){
  //宽度相同
  me.WatchAfter(function(){
    return [model.w(),model.size()]
  },function([w,count]){
    let i=0
    while(i < count){
      model.get(i).w(w)
      i++
    }
  }) 
}
/**
 * 高度相同
 * @param me 
 * @param model 
 */
export function sameHeight(me:MveUtil,model:SuperView){
  me.WatchAfter(function(){
    return [model.h(),model.size()]
  },function([h,count]){
    let i=0
    while(i < count){
      model.get(i).h(h)
      i++
    }
  })
}
/**
 * 所有子节点X方向上居中对齐
 * @param me 
 * @param model 
 */
export function centerX(me:MveUtil,model:SuperView){
  me.WatchAfter(function(){
    let ws:number[]=[]
    let w=model.w()
    let index=0
    while(index<model.size()){
      ws.push(model.get(index).w())
      index++
    }
    return [ws,w] as const
  },function([ws,w]){
    let index=0
    while(index<model.size()){
      model.get(index).x((w-ws[index])/2)
    }
  })
}
/**
 * 所有子节点Y方向上居中对齐
 * @param me 
 * @param model 
 */
export function centerY(me:MveUtil,model:SuperView){
  me.WatchAfter(function(){
    let hs:number[]=[]
    let h=model.h()
    let index=0
    while(index<model.size()){
      hs.push(model.get(index).h())
      index++
    }
    return [hs,h] as const
  },function([hs,h]){
    let index=0
    while(index<model.size()){
      model.get(index).y((h-hs[index])/2)
    }
  })
}
/**
 * 固定分割的行增长
 * @param me 
 * @param model 
 * @param arg 
 * @param setHeight 
 */
export function hListSplit(
  me:MveUtil,
  model:SuperView,
  arg:{
    begin:number,
    end:number,
    split:number
  },
  setHeight:(h:number)=>void
  ){
    me.WatchAfter(function(){
      let index=0
      let h=arg.begin
      let hs:number[]=[]
      while(index<model.size()){
        const child=model.get(index)
        hs.push(h)
        h=h+arg.split+child.h()
        index++
      }
      h=h+arg.end
      return [hs,h] as const
    },function([hs,h]){
      let index=0
      while(index<model.size()){
        const child=model.get(index)
        child.y(hs[index])
        index++
      }
      setHeight(h)
    })
}

/**
 * 其它使用场景
 * 均匀分布，但子视图根据父视图比例生长。按自己的比例，按相等的宽度。
 * 等用到的时候再来抽象吧
 */
export function hListAverge(
  me:MveUtil,
  model:SuperView,

){

}

/**
 * 宽度方向增长并换行
 */
export function wrcollect(me:MveUtil,model:SuperView){

}