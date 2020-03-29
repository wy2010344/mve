import { AppendChild, EModel, GenerateMeType, RealBuildChildrenType, MveParseChildrenType } from "./model";

export function dealChildResult(user_result){
  if(mb.Array.isArray(user_result)){
    var user_init=mb.Function.quote.one as any;
    var user_destroy=mb.Function.quote.one as any;

    var elements=user_result;
  }else{
    var user_init=user_result.init||mb.Function.quote.one;
    var user_destroy=user_result.destroy||mb.Function.quote.one;
    if('element' in user_result){
      //mb.log("children不推荐单元素")
      if(mb.Array.isArray(user_result.element)){
        var elements=user_result.element as any[];
      }else{
        var elements=[ user_result.element ]
      }
    }else{
      //没有生命周期的平结点
      var elements=[user_result]
    }
  }
  return {
    init:user_init as ()=>void,
    destroy:user_destroy as ()=>void,
    elements
  }
}

/**
 * 初始化时自动附加到dom
 * 销毁时自动销毁
 * 返回元素列表，手动组合
 */
export function mveParseChildFactory(p:{
  generateMe:GenerateMeType
}):MveParseChildrenType{
  return function(fun){
    return function(
      e:EModel,
      realBuildChildren:RealBuildChildrenType,
      keep:{
        appendChild:AppendChild;
      }
    ){
      const gm=p.generateMe();
      const user_result=dealChildResult(fun(gm.me));
      const element_result=realBuildChildren(e,gm.life,user_result.elements,{
        k:{},
        inits:[],
        destroys:[]
      },keep.appendChild)
      return {
        firstElement:element_result.firstElement,
        views:element_result.views,
        init(){
					gm.forEachRun(element_result.m.inits);
					user_result.init();
        },
        destroy(){
					gm.forEachRun(element_result.m.destroys);
					user_result.destroy();
          gm.destroy();
        }
      }
    }
  }
}