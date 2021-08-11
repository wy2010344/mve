import { initUpdateIndex, ModelWriteValue, moveUpdateIndex, removeUpdateIndex } from "./modelChildren";
import { mve } from "./util";
import { VirtualChild, VirtualChildParam } from "./virtualTreeChildren";

export interface VirtualList<T>{
	index(v:T,i:number):void
	index(v:T):number
	before(v:T,b:T):void
	before(v:T):T
	after(v:T,b:T):void
	after(v:T):T
}
export class VirtualListParam<T> implements VirtualChildParam<T>{
	constructor(
		private readonly list:BaseArray<T>,
		private up:VirtualList<T>
	){}
	k: any;
	remove(e: T): void {
		const after=this.up.after(e)
		const before=this.up.before(e)
		if(after){
			this.up.before(after,before)
		}
		if(before){
			this.up.after(before,after)
		}
		this.list.remove(this.up.index(e))
		//更新计数
		let tmp=after
		if(tmp){
			while(tmp){
				this.up.index(tmp,this.up.index(tmp)-1)
				tmp=this.up.after(tmp)
			}
		}
	}
	append(e: T, isMove?: boolean): void {
		if(isMove){
			//还在树节点上
			this.list.move(this.up.index(e),this.list.size()-1)
			//begin对应之前e后面一位，end取列表宽度
			const begin=this.up.index(e),end=this.list.size()
			for(let i=begin;i<end;i++){
				this.up.index(this.list.get(i),i)
			}
		}else{
			const size=this.list.size()
			const last=this.list.get(size-1)
			if(last){
				this.up.after(last,e)
				this.up.before(e,last)
			}
			this.list.insert(size,e)
			//更新位置
			this.up.index(e,size)
		}
	}
	insertBefore(e: T, old: T, isMove?: boolean): void {
		if(isMove){
			//还在节点上
			if(this.up.index(e)<this.up.index(old)){
				//前移到后
				this.list.move(this.up.index(e),this.up.index(old)-1)
				//begin取之前e后面一位，end取old的坐标。old不变，old前为e要更新
				const begin=this.up.index(e),end=this.up.index(old)
				for(let i=begin;i<end;i++){
					this.up.index(this.list.get(i),i)
				}
			}else{
				//后移到前
				this.list.move(this.up.index(e),this.up.index(old))
				//begin取old前一位，即e，要更新。end取e原来后面一位，e原来前面一们变成e.index要更新
				const begin=this.up.index(old)-1,end=this.up.index(e)+1
				for(let i=begin;i<end;i++){
					this.up.index(this.list.get(i),i)
				}
			}
		}else{
			const before=this.up.before(old)
			if(before){
				this.up.after(before,e)
				this.up.before(e,before)
			}
			this.up.after(e,old)
			this.up.before(old,e)
			this.list.insert(this.up.index(old),e)
			//更新位置
			this.up.index(e,this.up.index(old))
			while(old){
				this.up.index(old,this.up.index(old)+1)
				old=this.up.after(old)
			}
		}
	}
}
type DestroyFun=()=>void
function childBuilder<T,V>(
	out:DestroyFun[],
	child:ModelItem<V>,
	parent:VirtualChild<V>
){
	if(mb.Array.isArray(child)){
		let i=0
		while(i<child.length){
			childBuilder(out,child[i],parent)
			i++
		}
	}else
	if(isModelItemFun(child)){
		out.push(child(parent.newChildAtLast()))
	}else
	if(child instanceof ModelLife){
		out.push(child.destroy)
	}else{
		parent.push(child)
	}
}
export type ModelItemFun<V>=(
	parent:VirtualChild<V>
)=>DestroyFun
export class ModelLife{
	constructor(public readonly destroy:DestroyFun){}
}
export type ModelItem<V> = V | ModelItemFun<V> | ModelItem<V>[] | ModelLife
function isModelItemFun<T,V>(v:ModelItem<V>):v is ModelItemFun<V>{
	return typeof(v)=='function'
}

function baseChildrenBuilder<V>(children:ModelItem<V>,parent:VirtualChild<V>){
	const out:DestroyFun[]=[]
	childBuilder(out,children,parent)
	return function(){
		out.forEach(v=>v())
	}
}
/**
 * 自定义类似于重复的子节点。需要将其添加到生命周期。
 * @param root 
 */
export function superModelList<T,V>(root:ModelItem<V>,vp:VirtualList<V>){
	const list=mve.arrayModelOf<V>([])
	const destroy=baseChildrenBuilder(root,VirtualChild.newRootChild(new VirtualListParam(list,vp)))
	return {
		model:list as mve.CacheArrayModel<V>,
		destroy
	}
}
class ModelChildView<T> implements ModelWriteValue<T>{
	constructor(
		public readonly value:T,
		public readonly index:mve.Value<number>,
		public readonly destroy:DestroyFun
	){}
}

export type RenderListModelChildren<K,V>=(row:K,index:mve.GValue<number>)=>ModelItem<V>
function getView<K,V>(index:number,row:K,parent:VirtualChild<V>,fun:RenderListModelChildren<K,V>){
	const vindex=mve.valueOf(index)
	const value=fun(row,vindex)
	const vm=parent.newChildAt(index)
	const vx=baseChildrenBuilder(value,vm)
	return new ModelChildView(value,vindex,vx)
}
function superListModelChildren<K,V>(
	views:BaseArray<ModelChildView<ModelItem<V>>>,
	model:mve.CacheArrayModel<K>,
	fun:RenderListModelChildren<K,V>
):ModelItemFun<V>{
	return function(parent){
		const theView:mve.ArrayModelView<K>={
			insert(index,row){
				const view=getView(index,row,parent,fun)
				views.insert(index,view)
				initUpdateIndex(views,index)
			},
			remove(index){
				const view=views.get(index)
				if(view){
					view.destroy()
					views.remove(index)
					parent.remove(index)
					removeUpdateIndex(views,index)
				}
			},
			set(index,row){
				const view=getView(index,row,parent,fun)
				const oldView=views.set(index,view)
				oldView.destroy()
				parent.remove(index+1)
			},
			move(oldIndex,newIndex){
				views.move(oldIndex,newIndex)
				parent.move(oldIndex,newIndex)
				moveUpdateIndex(views,oldIndex,newIndex)
			}
		}
		model.addView(theView)
		return function(){
			model.removeView(theView)
		}
	}
}
/**
 * 类似于modelChildren
 * 但是如果单纯的树，叶子节点交换，并不能观察到是交换
 * @param model 
 * @param fun 
 */
export function listModelChilren<K,V>(
	model:mve.CacheArrayModel<K>,
	fun:RenderListModelChildren<K,V>
){
	return superListModelChildren([],model,fun)
}
/////////////////////////一种特例/////////////////////////////////////////////////////////////////////////////////
/**
 * 模仿DOM节点，有前后，和绝对位置
 */
export interface RNode<T>{
	data:T
	index:mve.GValue<number|null>
	before:mve.GValue<RNode<T>|null>
	after:mve.GValue<RNode<T>|null>
}
export function rwNodeOf<T>(v:T){
	return new RWNode(v)
}
class RWNode<T> implements RNode<T>{
	constructor(public data:T){}
	index=mve.valueOf(null)
	before=mve.valueOf(null)
	after=mve.valueOf(null)
}
const RMList:VirtualList<RWNode<any>>={
	index(v: RWNode<any>, i?: any) {
		if(arguments.length==1){
			return v.index()
		}else{
			v.index(i)
		}
	},
	before(v: RWNode<any>, b?: any) {
		if(arguments.length==1){
			return v.before()
		}else{
			v.before(b)
		}
	},
	after(v: RWNode<any>, b?: any) {
		if(arguments.length==1){
			return v.after()
		}else{
			v.after(b)
		}
	}
}
export function rnModelList<T>(root:ModelItem<RNode<T>>){
	return superModelList<T,RNode<T>>(root,RMList)
}