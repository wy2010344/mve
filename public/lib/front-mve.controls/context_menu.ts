import { menu, MenuFun } from "./menu";
export function context_menu(fun:MenuFun){
	let v_menu=menu(fun)
	return {
		show:function(e:MouseEvent){
			v_menu.show(e.clientX,e.clientY);
			mb.DOM.preventDefault(e);//阻止系统菜单
			mb.DOM.stopPropagation(e);//阻止后面的菜单之类
		},
		hide(){
			v_menu.hide();
		},
		destroy:function(){
			v_menu.destroy();
		}
	}
}