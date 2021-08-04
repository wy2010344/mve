import { dom, DOMNode } from "../mve-DOM/index";
import { mve, orDestroy, orInit, orRun } from "../mve/util";




export type MenuFun=(me:mve.LifeModel,x:{})=>{
	element:DOMNode;
	init?():void;
	destroy?():void;
}

export function menu(fun:MenuFun){
  const body=document.body;
  const show=mve.valueOf(false);
  const top=mve.valueOf(0);
  const left=mve.valueOf(0);
	const menu=dom.root(function(me){

		var render_object=fun(me,{});
		var p=render_object.element;

		p.type=p.type||"div";
		p.style=p.style||{};
		p.action=p.action||{};
		const style=p.style;
		const action=p.action;

		style.position="absolute";
		style.display=function(){
			return show()?"":"none";
		};
		style.top=function(){
			return top()+"px";
		};
		style.left=function(){
			return left()+"px";
		};

		function hide(){
			show(false);
		};

		p.init=function(){
			mb.DOM.addEvent(document,"click",hide);
			orRun(render_object.init);
		}
		p.destroy=function(){
			mb.DOM.removeEvent(document,"click",hide);
			orRun(render_object.destroy);
		}
		return p
	});
	let need_init=true;
	return {
		show(x:number,y:number){
			if(need_init){
				body.appendChild(menu.element);
				orInit(menu)
				need_init=false;
			}
			left(x);
			top(y);
			show(true);
		},
		hide(){
			show(false);
		},
		destroy(){
			if(!need_init){
				//已经初始化过了
				orDestroy(menu)
				body.removeChild(menu.element);
			}
		}
	};
}