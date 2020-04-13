import { BAbsView } from "./index";
import { mve } from "../mve/util";


export interface BParam{
  Watch(exp:()=>void):void
  WatchExp<A,B>(before:()=>A,exp:(a:A)=>B,after:(b:B)=>void):void
  WatchBefore<A>(before:()=>A,exp:(a:A)=>void):void
  WatchAfter<B>(exp:()=>B,after:(b:B)=>void):void
}
export class BParamImpl implements BParam{
  private pool:mve.Watcher[]=[]
  Watch(exp:()=>void){
    this.pool.push(mve.Watch(exp))
  }
  WatchExp<A,B>(before:()=>A,exp:(a:A)=>B,after:(b:B)=>void){
    this.pool.push(mve.WatchExp(before,exp,after))
  }
  WatchBefore<A>(before:()=>A,exp:(a:A)=>void){
    this.pool.push(mve.WatchBefore(before,exp))
  }
  WatchAfter<B>(exp:()=>B,after:(b:B)=>void){
    this.pool.push(mve.WatchAfter(exp,after))
  }
  destroy(){
    while(this.pool.length>0){
      this.pool.pop().disable()
    }
  }
}
export class BSub{
	view:BAbsView
}
export interface BSubParam extends BParam{
	index():number
}
class BSubParamImpl extends BParamImpl implements BSubParam{
	index(){
		return this.indexValue()
	}
	indexValue:mve.Value<number>
	constructor(i:number){
		super()
		this.indexValue=mve.valueOf(i)
	}
}
export type BSubGet<T extends BSub>=(index:BSubParam)=>T

export abstract class BSuper<T extends BSub>{
	constructor(
		private view:BAbsView
	){}
	protected init(
		me:BParam,
		outView?:BAbsView
	){
		outView = outView || this.view
		const that=this
		me.Watch(function(){
			outView.kSetW(that.getWidth())
		})
		me.Watch(function(){
			outView.kSetH(that.getHeight())
		})
	}
	private params:BSubParamImpl[]=[]
	private children:T[]=[]
	private count=mve.valueOf(0)

	abstract getWidth():number
	abstract getHeight():number

	size(){
		return this.count()
	}
	get(i:number){
		return this.children[i]
	}
	private reloadSize(i:number){
		while(i < this.params.length){
			this.params[i].indexValue(i)
			i++
		}
		this.count(this.children.length)
	}
	insert(i:number,get:BSubGet<T>) {
		const param=new BSubParamImpl(i)
		const child=get(param)
		//创建3个
		this.params.splice(i,0,param)
		this.children.splice(i,0,child)
		this.view.insert(i,child.view)
		this.reloadSize(i)
	}
	indexOf(v:T){
		return this.children.indexOf(v)
	}
  removeAt(i:number){
		//销毁4个
		this.params.splice(i,1)[0].destroy()
		this.children.splice(i,1)
		this.view.removeAt(i)

		this.reloadSize(i)
	}

	moveTo(from:number,to:number){
		if(from == to){
			return
		}
		const child=this.children.splice(from,1)[0]
		const param=this.params.splice(from)[0]
		this.view.removeAt(from)

		this.children.splice(to,0,child)
		this.params.splice(to,0,param)
		this.view.insert(to,child.view)

		const [min,max]= from < to ? [from,to]:[to,from]

		for(let i=min;i<=max;i++){
			this.params[i].indexValue(i)
		}
		this.count(this.count())
	}
	push(get:BSubGet<T>){
		this.insert(this.size(),get)
	}
	pop(){
		this.removeAt(this.size()-1)
	}
	unshift(get:BSubGet<T>){
		this.insert(0,get)
	}
	shift(){
		this.removeAt(0)
	}
}

export function subViewSameWidth<T extends BSub>(me:BParam,that:BSuper<T>){
	me.Watch(function(){
		const w=that.getWidth()
		const size=that.size()
		let i=0
		while(i < size){
			const view=that.get(i).view
			view.kSetX(0)
			view.kSetW(w)
			i = i + 1
		}
	})
}

export function subViewSameHeiht<T extends BSub>(me:BParam,that:BSuper<T>){
	me.Watch(function(){
		const h=that.getHeight()
		const size=that.size()
		let i=0
		while(i < size){
			const view=that.get(i).view
			view.kSetY(0)
			view.kSetH(h)
			i = i + 1
		}
	})
}