import { BView, BScrollView, BAbsView } from "./index";
import { mve } from "../mve/util";


export interface ArrayModelItem{
	index:mve.Value<number>
	getView():BAbsView
}

export abstract class ArrayModel<T extends ArrayModelItem>{
	abstract getView():BView|BScrollView
	private s=mve.valueOf(0)
	size(){
		return this.s()
	}
	private children:T[]=[]
	
	private updateIndex(index:number){
		for(let i=index;i<this.children.length;i++){
			this.children[i].index(i)
		}
		this.s(this.children.length)
	}
	insert(index:number,item:T){
		this.children.splice(index,0,item)
		this.getView().insert(index,item.getView())
		this.updateIndex(index)
	}
	removeAt(index:number){
		this.children.splice(index,1)
		this.getView().removeAt(index)
		this.updateIndex(index)
	}
	push(item:T){
		this.insert(this.size(),item)
	}
	pop(){
		this.removeAt(this.size()-1)
	}
	unshift(item:T){
		this.insert(0,item)
	}
	shift(){
		this.removeAt(0)
	}
}