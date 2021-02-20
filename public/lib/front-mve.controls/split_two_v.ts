import { PNJO } from "../mve-DOM/index";
import { dragMoveHelper } from "../mve-DOM/other/drag";
import { mve } from "../mve/util";

export function split_two_v(me:mve.LifeModel,p:{
	width:mve.GValue<number>;
	height:mve.GValue<number>;
	init?:number;
	split_height?:number;
	render:(me:mve.LifeModel,x:{
		top_height:mve.Value<number>;
		bottom_height:mve.GValue<number>;
	})=>{
		init?:()=>void;
		destroy?:()=>void;
		top:PNJO;
		bottom:PNJO;
	}
}){
	
	const v_height=p.split_height||10;
	const init=p.init||1/2;
	const top_height=mve.valueOf((p.height()-v_height)*init);
	const bottom_height=me.Cache(function(){
			return p.height()-top_height()-v_height;
	});
	const render_object=p.render(me,{
		top_height:top_height,//允许内部改变top_height
		bottom_height:bottom_height
	});

	render_object.top.style=render_object.top.style||{};
	mb.Object.ember(render_object.top.style,{
		height:function(){
			return top_height()+"px";
		},
		width:function(){
			return p.width()+"px";
		},
		position:"absolute",
		left:"0px",
		top:"0px",
		overflow:"auto"
	});
	render_object.bottom.style=render_object.bottom.style||{};
	mb.Object.ember(render_object.bottom.style,{
		height:function(){
			return bottom_height()+"px"
		},
		width:function(){
			return p.width()+"px";
		},
		position:"absolute",
		overflow:"auto",
		left:"0px",
		bottom:"0px"
	});

	const dragMove=dragMoveHelper({
		diff(p){
			const y=p.y
			if(y != 0){
				top_height(top_height()+y);
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
			render_object.top,
			{
				type:"div",
				style:{
					width(){
						return p.width()+"px"
					},
					background:"gray",
					height:(v_height-2)+"px",
					left:"0px",
					margin:"1px 0",
					top(){
						return top_height()+"px";
					},
					cursor:"s-resize",
					position:"absolute"
				},
				action:{
					mousedown:dragMove
				}
			},
			render_object.bottom
		]
	} as PNJO
}