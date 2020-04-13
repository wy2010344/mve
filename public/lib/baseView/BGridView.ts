import { BParam, BSubGet, BSuper, BSub } from "./ArrayModel";
import { BView, BAbsView } from "./index";
import { mve } from "../mve/util";




export abstract class BExpandGridViewSuperT<T extends BSub> extends BSuper<T>{
	getHeight(){
		return this.allHeight()
	}
	getWidth(){
		return this.cellWidth() * this.columnCount()
	}
	cellWidth(){
		return 0
	}
	cellHeight(){
		return 0
	}
	columnCount(){
		return 1
	}
	private allHeight=mve.valueOf(0)
	constructor(me:BParam,view:BAbsView){
		super(view)
		this.init(me,view)
		const that=this
		me.WatchAfter(function(){
			const size=that.size()
			const cw=that.cellWidth()
			const ch=that.cellHeight()
			const cc=that.columnCount()>0?that.columnCount():1

			let i=0
			let col=0,row=0
			while(i<size){
				const child=that.get(i)
				col = i % cc
				row = i / cc
				child.view.kSetX(col * cw)
				child.view.kSetY(row * ch)
				i= i+1
			}
			return (row + 1)* ch
		},function(h){
			that.allHeight(h)
		})

		me.Watch(function(){
			const cw=that.cellWidth()
			const size=that.size()
			let i=0
			while(i < size){
				that.get(i).view.kSetW(cw)
				i = i + 1
			}
		})
		me.Watch(function(){
			const ch=that.cellHeight()
			const size=that.size()
			let i=0
			while(i < size){
				that.get(i).view.kSetH(ch)
				i = i + 1
			}
		})
	}
}