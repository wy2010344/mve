
import { PNJO } from "../mve-DOM/index";
import { dragMoveHelper } from "../mve-DOM/other/drag";
import { mve } from "../mve/util";

export interface SplitItem{
	width?:mve.Value<number>
	element:PNJO
}
/**
 * 对比表头的拖动。
 * 表头只是有上下居中。但目前有了确定的点位（不用表格）
 * 文字上下居中，使用line-height
 * @param p 
 */
export function split(me:mve.LifeModel,p:{
	splitWidth?:number;
	width:mve.GValue<number>;
	height:mve.GValue<number>;
	children:SplitItem[]
}){
	
	const h_width=p.splitWidth||10;
	const per_width=(p.width()-((p.children.length-1)*h_width))/p.children.length;/*每一格宽度*/
	function calLeft(i:number){
		var w=0;
		for(var x=0;x<i;x++){
			w=w+part_width[x]()+h_width;
		}
		return w;
	};
	function Hill(i:number):PNJO{
		return {
			type:"div",
			style:{
				height:function(){
					return p.height()+"px"
				},
				background:"gray",
				width:(h_width-2)+"px",
				margin:"0 2px",
				top:"0px",
				left:function(){
					return calLeft(i+1)-h_width+"px";
				},
				cursor:"w-resize",
				position:"absolute"
			},
			action:{
				mousedown(e){
					move_index=i;
					dragMove(e);
				}
			}
		};
	};
	const part_width:mve.Value<number>[]=[];
	for(var i=0;i<p.children.length;i++){
		const width=p.children[i].width||mve.valueOf(per_width);
		if(width()==0){
			width(per_width);
		}
		part_width.push(width);
	}
  var old_w=p.width();
	me.WatchAfter(function(){
			return p.width();
		},function(w:number){
			var px=(w-old_w)/part_width.length;
			mb.Array.forEach(part_width,function(pw){
				pw(pw()+px);
			});
			old_w=w;
		}
	);
	
	function Part(i:number):PNJO{
		let child=p.children[i].element;
		child.style=child.style||{};
		child.style.height=function(){
			return p.height()+"px"
		};
		child.style.width=function(){
			return part_width[i]()+"px";
		};
		child.style.position="absolute";
		child.style.left=function(){
			return calLeft(i)+"px";
		};
		child.style.top="0px";
		child.style.overflow="auto";
		return child;
	};
	let move_index=0;/*移动的序号*/

	const children=[];
	for(var i=0;i<p.children.length-1;i++){
		children.push(Part(i));
		children.push(Hill(i));
	}
	children.push(Part(p.children.length-1));

	const dragMove=dragMoveHelper({
		diff(p){
			const x=p.x
			if(x != 0){
				const pl=part_width[move_index];
				const pr=part_width[move_index+1];
				pl(pl() + x);
				pr(pr() - x);
			}
		}
	})
	return {
		type:"div",
		style:{
			position:"relative",
			height(){
				return p.height()+"px";
			}
		},
		children:children
	}
}