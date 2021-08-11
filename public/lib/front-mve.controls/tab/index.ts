import { dom, DOMNode, reWriteEvent } from "../../mve-DOM/index";
import { EOChildFun, EOChildren } from "../../mve/childrenBuilder";
import { modelChildren } from "../../mve/modelChildren";
import { mve } from "../../mve/util";

/**
tabs:ArrayModel 外部注入
current
render
*/
export function tab<T>(me:mve.LifeModel,p:{
	tabs?:mve.ArrayModel<T>
	current?:mve.Value<T>
	render:(me:mve.LifeModel,x:{
		tabs:mve.ArrayModel<T>
		current:mve.Value<T>
		build_head_children(fun:(me:mve.LifeModel,row:T,index:mve.GValue<number>)=>DOMNode):EOChildFun<Node>,
		build_body_children(fun:(me:mve.LifeModel,row:T,index:mve.GValue<number>)=>DOMNode):EOChildFun<Node>,
	})=>EOChildren<Node>
}){
	var tabs=p.tabs||mve.arrayModelOf<T>([]);
	var current=p.current||mve.valueOf<T>(null);
	return p.render(me,{
    tabs:tabs,
    current:current,
    build_head_children(fun){
      return modelChildren(tabs,function(me,row,index){
        const element=fun(me,row,index);
        element.event=element.event||{};
			  reWriteEvent(element.event,'mousedown',function(vs){
					vs.push(function(){
						current(row)
					})
					return vs
				})
        return dom(element)
      })
    },
    build_body_children(fun){
      return modelChildren(tabs,function(me,row,index){
				const element=fun(me,row,index);
				element.style=element.style||{};
				element.style.display=function(){
					return current()==row?"":"none";
				};
				return dom(element)
      })
    }
	});
}