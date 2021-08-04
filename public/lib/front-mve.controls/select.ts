import { dom, DOMNode, reWriteDestroy } from "../mve-DOM/index";
import { mve } from "../mve/util";
import { menu } from "./menu";

/*
input(me)
menu(me)
select:选中事件
value:观察者
*/
export function select(p:{
	select:any;
	value:any;
	input:(me:mve.LifeModel,x:{
		select:any;
		value:any;
		setInput(v:HTMLInputElement):void
		show_menu:()=>void;
		filter:(v:string)=>void;
	})=>DOMNode;
	menu:(me:mve.LifeModel,x:{})=>{
		init?:()=>void;
		destroy?:()=>void;
		element:DOMNode;
	}
}){
	return dom.root(function(me){
		var filter=mve.valueOf("");
		let inputElement:HTMLInputElement
		const input=p.input(me,{
			select:p.select,
			value:p.value,
			setInput(v:HTMLInputElement){
				inputElement=v
			},
			show_menu:function(){
				const x=inputElement
				v_menu.show(x.offsetLeft,x.offsetTop+x.offsetHeight);
			},
			filter:function(v){
				if(v!=filter()){
					filter(v);
				}
			}
		});
		const v_menu=menu(function(me){
			return p.menu(me,{
				select:p.select,
				value:p.value,
				filter:filter//不允许从下方改变筛选
			});
		});
		const destroy=input.destroy
		reWriteDestroy(input,function(destroy){
			destroy.unshift(function(){
				v_menu.destroy();
			})
			return destroy
		})
		return input
	});
}