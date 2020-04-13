import { BView, BAbsView } from "./index"
import { BSuper, BSub, BSubGet, BSubParam, BParam, subViewSameWidth, subViewSameHeiht } from "./ArrayModel"
import { mve } from "../mve/util"





export abstract class BNavigationViewSuper<T extends BSub = BSub> extends BSuper<T>{
	redirect(get:BSubGet<T>){
		this.pop()
		this.push(get)
	}
	constructor(me:BParam,view:BAbsView){
		super(view)
		this.init(me,view)
		subViewSameWidth(me,this)
		subViewSameHeiht(me,this)
	}
}


export class BStack extends BSuper<BSub>{
	width=mve.valueOf(0)
	getWidth(){
		return this.width()
	}
	height=mve.valueOf(0)
	getHeight(){
		return this.height()
	}
	constructor(me:BParam,view:BAbsView){
		super(view)
		this.init(me,view)
		subViewSameWidth(me,this)
		subViewSameHeiht(me,this)
	}
}