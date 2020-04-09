import { mve } from "../mve/util"



export class MveUtil{
  private pool:mve.Watcher[]=[]
  Watch(exp){
    this.pool.push(mve.Watch(exp))
  }
  WatchExp<A,B>(before:()=>A,exp:(a:A)=>B,after:(b:B)=>void){
    this.pool.push(mve.WatchExp(before,exp,after))
  }
  WatchBefore<A>(before:()=>A,exp:(a:A)=>void){
    this.pool.push(mve.WatchBefore(before,exp))
  }
  WatchAfter<B>(exp:()=>B,after:(b:B)=>void){
    this.pool.push(mve.WatchAfter(exp,after))
  }
  destroy(){
    while(this.pool.length>0){
      this.pool.pop().disable()
    }
  }
}