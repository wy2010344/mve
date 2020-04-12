import { BSub, BSuper, BSubGet, BParam } from "./ArrayModel"
import { BScrollView, BView } from "./index"
import { mve } from "../mve/util"



export interface BListSub extends BSub{
	height():number
}
//对应widenList，变宽
export function increaseListOf(me:BParam,p:{
	view:BView,
	width():number
}){
	me.Watch(function(){
		p.view.setW(p.width())
	})
	const superArray=new BSuper<BListSub>(p.view)
	const height=mve.valueOf(0)
	me.WatchAfter(function(){
		let h=0
		let i=0
		while(i < superArray.count()){
			const child=superArray.get(i)
			const ch=child.height()
			child.view.setY(h)
			child.view.setH(ch)
			h=h+ch
			i++
		}
		return h
	},function(h){
		height(h)
	})

	const it={
		width:p.width,
		height(){
			return height()
		},
		insert(index:number,get:BSubGet<BListSub>){
			superArray.insert(index,get)
		},
		removeAt(index:number){
			superArray.removeAt(index)
		}
	}
	return it
}
export function scrollListOf(mve:BParam,p:{
	view:BScrollView,
	width():number
	height():number
}){
	mve.Watch(function(){
		p.view.setW(p.width())
		p.view.setIW(p.width())
	})
	mve.Watch(function(){
		p.view.setH(p.height())
	})
	const superArray=new BSuper<BListSub>(p.view)
	mve.Watch(function(){
		let h=0
		let i=0
		while(i < superArray.count()){
			const child=superArray.get(i)
			const ch=child.height()
			child.view.setY(h)
			child.view.setH(ch)
			h=h+ch
			i++
		}
		p.view.setIH(h)
	})
	const it={
		width:p.width,
		height:p.height,
		insert(index:number,get:BSubGet<BListSub>){
			superArray.insert(index,get)
		},
		removeAt(index:number){
			superArray.removeAt(index)
		}
	}
	return it
}