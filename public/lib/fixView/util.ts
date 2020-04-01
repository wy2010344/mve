import { mve } from "../mve/util";
import { parseUtil } from "../mve/index";

export interface UAbsView{
	x:mve.TValue<number>,
	y:mve.TValue<number>,
	w:mve.TValue<number>,
	h:mve.TValue<number>,
}

export function buildAbs(me:mve.LifeModel,e:HTMLElement,child:UAbsView){
	e.style.position="absolute"
	parseUtil.bind(me,child.x,function(v){
		e.style.left=v+"px"
	})
	parseUtil.bind(me,child.y,function(v){
		e.style.top=v+"px"
	})
	parseUtil.bind(me,child.w,function(v){
		e.style.width=v+"px"
	})
	parseUtil.bind(me,child.h,function(v){
		e.style.height=v+"px"
	})
}