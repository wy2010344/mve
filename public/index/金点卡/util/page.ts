import { mve } from "../../../lib/mve/util";
import { MveOuterResult, parseUtil } from "../../../lib/mve/index";
import { NJO, parseHTML } from "../../../lib/mve-DOM/index";


export interface PageResult extends MveOuterResult<NJO>{
  title:mve.TValue<string>
}
export function pageOf(fun:(me:mve.LifeModel)=>PageResult){
  return parseHTML.mve(function(me){
    const ur=fun(me)
    parseUtil.bind(me,ur.title,function(v){
      document.title=v
    })
    return ur
  })
}