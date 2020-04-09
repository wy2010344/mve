import { BView, BScrollView, BAbsView } from "./index";
import { mve } from "../mve/util";



function valueOf(v:number,set:(v:number)=>void):mve.Value<number>{
	const cache=mve.valueOf(v)
	return function(){
		if(arguments.length==0){
			return cache()
		}else{
			let v=arguments[0]
			set(v)
			cache(v)
		}
	}
}
export class BaseView<T  extends BAbsView>{
	public readonly x:mve.Value<number>
	public readonly y:mve.Value<number>
	public readonly w:mve.Value<number>
	public readonly h:mve.Value<number>
	constructor(
		public readonly view:T
	){
		this.x=valueOf(0,function(v){
			view.setX(v)
		})
		this.y=valueOf(0,function(v){
			view.setY(v)
		})
		this.w=valueOf(0,function(v){
			view.setW(v)
		})
		this.h=valueOf(0,function(v){
			view.setH(v)
		})
	}
	destroy(){}
}

export class SubView extends BaseView<BAbsView>{
	index=mve.valueOf(0)
}

export class SuperView extends BaseView<BScrollView|BView>{
	private count=mve.valueOf(0)
	size(){
		return this.count()
	}
	private children:SubView[]=[]
	
	get(index:number){
		return this.children[index]
	}
	private updateIndex(index:number){
		for(let i=index;i<this.children.length;i++){
			this.children[i].index(i)
		}
		this.count(this.children.length)
	}
	insert(index:number,item:SubView){
		this.children.splice(index,0,item)
		this.view.insert(index,item.view)
		this.updateIndex(index)
	}
	removeAt(index:number){
		const child=this.children.splice(index,1)[0]
		if(child){
			this.view.removeAt(index)
			child.destroy()
			this.updateIndex(index)
		}else{
			mb.log(`只有${this.size()}，移除${index}失败`)
		}
	}
	push(item:SubView){
		this.insert(this.size(),item)
	}
	pop(){
		this.removeAt(this.size()-1)
	}
	unshift(item:SubView){
		this.insert(0,item)
	}
	shift(){
		this.removeAt(0)
	}
}