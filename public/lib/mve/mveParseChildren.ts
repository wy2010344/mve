import { AppendChild, EModel, GenerateMeType, RealBuildChildrenType, MveParseChildrenType } from "./model";
/**
 * 初始化时自动附加到dom
 * 销毁时自动销毁
 */
export=function(p:{
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
      const user_result=fun(gm.me);
			const user_init=user_result.init||mb.Function.quote.one;
      const user_destroy=user_result.destroy||mb.Function.quote.one;
      const element_result=realBuildChildren(e,gm.life,user_result.elements,{
        k:{},
        inits:[],
        destroys:[]
      },function(pel,el){
        keep.appendChild(pel,el);
      })
      return {
        firstElement:element_result.firstElement,
        firstChild:element_result.firstChild,
        init(){
					gm.forEachRun(element_result.m.inits);
					user_init();
        },
        destroy(){
					gm.forEachRun(element_result.m.destroys);
					user_destroy();
          gm.destroy();
        }
      }
    }
  }
}