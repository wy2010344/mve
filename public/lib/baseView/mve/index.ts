import { BParam } from "../arraymodel";
import { CEResult, childrenBuilder, CResult, CChildType } from "./childrenBuilder";
import { VirtualChildParam } from "../../mve/virtualTreeChildren";
import { mve } from "../../mve/util";

export const parseUtil={
  bind<T>(me:BParam,value:mve.TValue<T>,fun:(v:T)=>void){
    if(typeof(value)=='function'){
      me.WatchAfter(
        function(){
          return (value as any)()
        },
        fun
      )
    }else{
      fun(value)
    }
  },
  bindKV<T>(me:BParam,map:{ [key: string]: mve.TValue<T>},fun:(k:string,v:T)=>void){
    mb.Object.forEach(map,function(v,k){
      parseUtil.bind(me,map[k],function(v){
        fun(k,v)
      })
    })
  }
}


export interface ParseOfResult<JO,EO>{
  view(me:BParam,child:JO):CEResult<EO>,
  children(me:BParam,p:VirtualChildParam<EO>,children:CChildType<JO,EO>[]):CResult
}

export function parseOf<JO,EO>(view:(me:BParam,child:JO)=>CEResult<EO>){

  return {
    view,
    children:childrenBuilder<JO,EO>(view)
  }
}