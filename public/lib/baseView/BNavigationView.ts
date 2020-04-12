import { BView, BAbsView } from "./index"
import { BSuper, BSub, BSubGet, BSubParam, BParam } from "./ArrayModel"




export function navigationOf(mve:BParam,p:{
	view:BView,
	width():number,
	height():number
}){
	const superArray=new BSuper<BSub>(p.view)
	mve.Watch(function(){
		p.view.setW(p.width())
	})
	mve.Watch(function(){
		let i=0
		while(i<superArray.count()){
			superArray.get(i).view.setW(p.width())
			i++
		}
	})
	mve.Watch(function(){
		p.view.setH(p.height())
	})
	mve.Watch(function(){
		let i=0
		while(i<superArray.count()){
			superArray.get(i).view.setH(p.height())
			i++
		}
	})
	const it={
		width:p.width,
		height:p.height,
		push(get:BSubGet<BSub>){
			superArray.push(get)
		},
		pop(){
			superArray.pop()
		},
		redirect(get:BSubGet<BSub>){
			superArray.pop()
			superArray.push(get)
		},
		count(){
			return superArray.count()
		}
	}
	return it
}

export type BNavigationView=ReturnType<typeof navigationOf>
function dialogBack(){
	const view=new BView()
	view.setBackground("white")
	return view
}
export function dialogOf(
	navigation:BNavigationView,
	mve:BSubParam,
	p:{
		view?:BView,
		content:BAbsView
	}):BSub{
	const view=p.view?p.view:dialogBack()
	mve.Watch(function(){
		
	})
	return {
		view
	}
}