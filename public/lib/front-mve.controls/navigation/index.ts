import { dom, DOMNode } from "../../mve-DOM/index";
import { EOChildren } from "../../mve/childrenBuilder";
import { modelChildren } from "../../mve/modelChildren";
import { mve } from "../../mve/util";

/**
 * 
就一个简单的等宽等高的控件
一定是等宽等高吗？只是绝对定位，坐标相同。
如果不是等宽高，与桌面有什么区别？再偏向可移动（没有遮罩调整位置）

内部的弹窗系统
这个东西只能靠内部改变，不能靠外部

待实现，做成跟desktop差不多的样子
init(params)
destroy
width:Function 依赖父
height:Function 依赖父
*/
export interface NavMethod<T>{
	current:()=>T;
	size:mve.GValue<number>;
	pop:()=>void;
	push:<V>(type:(params:NavMethod<T>,v?:V)=>T,v?:V)=>void;
}
export function navigation<T>(p:{
	render:(me:mve.LifeModel,params:NavMethod<T>,x:{
		build_head_children:(repeat:(me:mve.LifeModel,row:T,index:mve.GValue<number>)=>EOChildren<Node>)=>EOChildren<Node>
		build_body_children:(repeat:(me:mve.LifeModel,row:T,index:mve.GValue<number>)=>DOMNode)=>EOChildren<Node>
	})=>DOMNode
}){
	return dom.root(function(me){
		var current=mve.valueOf<T>(null);
		var model=mve.arrayModelOf<T>([]);
		var params:NavMethod<T>={
			current,
			size:function(){
				return model.size();
			},
			pop:function(){
				model.pop()
				current(model.getLast());
			},
			push:function(type,v){
				/*
				init
				destroy
				title:Function/String
				children:[]
				*/
				var o=type(params,v);
				model.push(o);
				current(o);
			}
			/*,
			load:function(url,after){
				mb.ajax.require(url,function(type){
					var obj=params.push(type);
					if(after){
						after(obj);
					}
				});
			},
			load_with:function(url,args,after){
				mb.ajax.require(url,function(fun){
					var type=fun(args);
					var obj=params.push(type);
					if(after){
						after(obj);
					}
				});
			}*/
		};
		return p.render(me,params,{
			build_head_children(repeat){
        return modelChildren(model,repeat)
			},
			build_body_children(repeat){
        return modelChildren(model,function(me,row,index){
          const element=repeat(me,row,index);
          element.style=element.style||{};
          element.style.display=function(){
            return current()==row?"":"none";
          };
          return dom(element)
        });
			}
		});
	});
}