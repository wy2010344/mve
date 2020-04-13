import { BSub, BSuper, BSubGet, BParam, subViewSameWidth } from "./ArrayModel"
import { BView, BAbsView } from "./index"
import { mve } from "../mve/util"



export class BListViewSub extends BSub{
	getHeight(){
		return 44
	}
}

export abstract class BIncreaseListViewSuperT<T extends BListViewSub> extends BSuper<T>{
	private height=mve.valueOf(0)
	getHeight(){
		return this.height()
	}
	getSplitHeight(){
		return 0
	}
	constructor(me:BParam,view:BAbsView){
		super(view)
		this.init(me,view)
		const that=this
		me.WatchAfter<number>(function(){
			let h=0
			const sh=that.getSplitHeight()
			let index=0
			let size=that.size()
			while(index < size){
				const child=that.get(index)
				child.view.kSetY(h)
				const ch=child.getHeight()
				child.view.kSetH(ch)
				h = h + sh + ch
				index = index +1
			}
			if(size>0){
				return h-sh
			}else{
				return h
			}
		},function(h){
			that.height(h)
		})
		subViewSameWidth(me,this)
	}
}

export abstract class BScrollListViewSuperT<T extends BListViewSub> extends BSuper<T>{
	private height=mve.valueOf(0)
	getSplitHeight(){
		return 0
	}
	private scrollHeight=mve.valueOf(0)
	getScrollHeight(){
		return this.scrollHeight()
	}
	private contentView=new BView()
	constructor(me:BParam,view:BView){
		super(view)
		view.push(this.contentView)
		this.init(me,this.contentView)
		const that=this
		me.WatchAfter<number>(function(){
			let h=0
			const sh=that.getSplitHeight()
			let index=0
			let size=that.size()
			while(index < size){
				const child=that.get(index)
				child.view.kSetY(h)
				const ch=child.getHeight()
				child.view.kSetH(ch)
				h = h + sh + ch
				index = index +1
			}
			if(size>0){
				return h-sh
			}else{
				return h
			}
		},function(h){
			that.height(h)
		})
		me.Watch(function(){
			that.contentView.kSetW(that.getWidth())
		})
		subViewSameWidth(me,this)
	}
}
