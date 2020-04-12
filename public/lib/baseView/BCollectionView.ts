import { BParam, BSubGet, BSuper, BSub } from "./ArrayModel";
import { BView } from "./index";
import { mve } from "../mve/util";


export function collectionOf(me:BParam,p:{
	view:BView,
	cellWidth():number
	cellHeight():number
	columnCount():number
}) {
	const superArray=new BSuper<BSub>(p.view)

	const height=mve.valueOf(0)
	me.WatchAfter(function(){
		const size=superArray.count()
		const cw=p.cellWidth()
		const ch=p.cellHeight()
		const cc=p.columnCount()>0?p.columnCount():1
		let i=0

		var col=0,row=0
		while(i<size){
			const child=superArray.get(i)

			col=i%cc
			row=i/cc

			child.view.setX(col*cw)
			child.view.setY(row*ch)

			i++
		}
		return row
	},function(row){
		height((row+1)*p.cellHeight())
	})

	const it={
		width(){
			return p.cellWidth()*p.columnCount()
		},
		height(){
			return height()
		},
		insert(index:number,get:BSubGet<BSub>){
			superArray.insert(index,get)
		},
		removeAt(index:number){
			superArray.removeAt(index)
		}
	}
	me.Watch(function() {
		p.view.setW(it.width())
	})
	me.Watch(function() {
		p.view.setH(it.height())
	})
	return it
}