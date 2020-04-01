import { UView } from "../view";
import { mve } from "../../mve/util";
import { modelChildren } from "../../mve/modelChildren";
import { JOChildren } from "../../mve/childrenBuilder";
import { UAllView } from "../index";



export interface ListItemModel{
	h:mve.TValue<number>,
	background?:mve.TValue<string>,
	children?:JOChildren<UAllView,Node>
}


export function listView(p:{
	x:mve.TValue<number>,
	y:mve.TValue<number>,
	w:mve.TValue<number>
	h:mve.TValue<number>,
	model:mve.ArrayModel<ListItemModel>
}):UView{
	
	function countModel(index){
		let ah=0
		for(let i=0;i<index;i++){
			const h=p.model.get(i).h
			if(typeof(h)=='function'){
				ah=ah+h()
			}else{
				ah=ah+h
			}
		}
		return ah
	}
	return {
		type:"view",
		x:p.x,y:p.y,w:p.w,h:p.h,
		children:modelChildren(p.model,function(me,row,index){
			return {
				type:"view",
				x:0,
				y(){
					return countModel(index())
				},
				w:p.w,
				h:row.h,
				background:row.background,
				children:row.children
			}
		})
	}
}