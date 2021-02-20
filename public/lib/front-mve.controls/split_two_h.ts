



/**
 * 可以进一步简化，依赖外部的mve。
 * left的right都可以用div，可以控制overflow等属性。
 * render里的init和destroy都可以不要，直接依附于父环境的。
 * 但如果子环境生成init和destroy，但父环境没有适当的接口，就必须用mve来处理？
 * 
 * 像split一样改造，全局的拖动事件
 * @param p 
 */

import { PNJO } from "../mve-DOM/index";
import { dragMoveHelper } from "../mve-DOM/other/drag";
import { mve } from "../mve/util";

export function split_two_h(me:mve.LifeModel,p:{
	width:mve.GValue<number>;
	height:mve.GValue<number>;
	init?:number;
	split_width?:number;
	render:(me:mve.LifeModel,x:{
		left_width:mve.Value<number>;
		right_width:mve.GValue<number>;
	})=>{
		init?:()=>void;
		destroy?:()=>void;
		left:PNJO;
		right:PNJO;
	}
}){
	const h_width=p.split_width||10;
	const init=p.init||1/2;
	const left_width=mve.valueOf((p.width()-h_width)*init);
	const right_width=me.Cache(function(){
			return p.width()-left_width()-h_width;
	});
	const render_object=p.render(me,{
		left_width:left_width,//允许内部改变left_width
		right_width:right_width
	});

	render_object.right.style=render_object.right.style||{};
	mb.Object.ember(render_object.right.style,{
		height:function(){
			return p.height()+"px"
		},
		width:function(){
			return right_width()+"px";
		},
		position:"absolute",
		overflow:"auto",
		right:"0px",
		top:"0px"
	});
	render_object.left.style=render_object.left.style||{};
	mb.Object.ember(render_object.left.style,{
		height:function(){
			return p.height()+"px"
		},
		width:function(){
			return left_width()+"px";
		},
		position:"absolute",
		left:"0px",
		top:"0px",
		overflow:"auto"
	});
	const dragMove=dragMoveHelper({
		diff(p){
			const x=p.x
			if(x != 0){
				left_width(left_width()+x);
			}
		}
	})
	return {
		type:"div",
		init:render_object.init,
		destroy:render_object.destroy,
		style:{
			width:function(){
				return p.width()+"px";
			},
			height:function(){
				return p.height()+"px";
			},
			position:"relative"
		},
		children:[
			render_object.left,
			{
				type:"div",
				style:{
					height(){
						return p.height()+"px"
					},
					background:"gray",
					width:(h_width-2)+"px",
					top:"0px",
					margin:"0 1px",
					left(){
						return left_width()+"px";
					},
					cursor:"w-resize",
					position:"absolute"
				},
				action:{
					mousedown:dragMove
				}
			},
			render_object.right
		]
	}  as PNJO
}