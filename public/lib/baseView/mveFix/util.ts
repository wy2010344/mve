import { mve } from "../../mve/util";
import { BParam, BSuper, BSub } from "../arraymodel";
import { BAbsView } from "../index";
import { parseUtil } from "../mve/index";
import { VirtualChildParam } from "../../mve/virtualTreeChildren";


export interface CAbsView{
	x?:mve.TValue<number>,
	y?:mve.TValue<number>,
	w:mve.TValue<number>,
	h:mve.TValue<number>,
	background?:mve.TValue<string>
}

export function buildAbs(me:BParam,e:BAbsView,child:CAbsView){
	if(child.x){
		parseUtil.bind(me,child.x,function(v){
			e.kSetX(v)
		})
	}
	if(child.y){
		parseUtil.bind(me,child.y,function(v){
			e.kSetY(v)
		})
	}
	parseUtil.bind(me,child.w,function(v){
		e.kSetW(v)
	})
	parseUtil.bind(me,child.h,function(v){
		e.kSetH(v)
	})
	if(child.background){
		parseUtil.bind(me,child.background,function(v){
			e.setBackground(v)
		})
	}
}


export class BViewVirtualParam implements VirtualChildParam<BAbsView>{
	constructor(
		private pel:BAbsView
	){}
	remove(e: BAbsView): void {
		const index=this.pel.indexOf(e)
		if(index > -1){
			this.pel.removeAt(index)
		}else{
			mb.log("remove失败")
		}
	}
	append(e: BAbsView, isMove?: boolean): void {
		this.pel.push(e)
	}
	insertBefore(e: BAbsView, old: BAbsView, isMove?: boolean): void {
		const index=this.pel.indexOf(e)
		if(index > -1){
			this.pel.insert(index,e)
		}else{
			mb.log("insertBefore失败")
		}
	}
}

export class BArrayVirtualParam<T extends BSub> implements VirtualChildParam<T>{
	constructor(
		private pel:BSuper<T>
	){}
	remove(e: any): void {
		const index=this.pel.indexOf(e)
		if(index > -1){
			this.pel.removeAt(index)
		}else{
			mb.log("remove失败")
		}
	}
	append(e: any, isMove?: boolean): void {
		this.pel.push(e)
	}
	insertBefore(e: any, old: any, isMove?: boolean): void {
		const index=this.pel.indexOf(old)
		if(index > -1){
			this.pel.insert(index,e)
		}else{
			mb.log("insertBefore失败")
		}
	}
}