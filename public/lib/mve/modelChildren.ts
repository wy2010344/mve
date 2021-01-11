import { JOChildFun, JOChildren } from "./childrenBuilder";
import { BuildResult, mve, onceLife, orRun, orInit, orDestroy } from "./util";

export interface ModelCacheValue<V>{
	index:mve.GValue<number>
	value:V
}
export type ModelCacheChildren<V>=mve.CacheArrayModel<ModelCacheValue<V>>

interface ModelWriteValue<V> extends ModelCacheValue<V>{
	index:mve.Value<number>
	destroy():void
}

/**
 * 初始化更新计数
 * @param views 
 * @param index 
 */
function initUpdateIndex<V>(views:BaseReadArray<ModelWriteValue<V>>,index:number){
	for(let i=index+1;i<views.size();i++){
		views.get(i).index(i)
	}
}
/**
 * 删除时更新计算
 * @param views 
 * @param index 
 */
function removeUpdateIndex<V>(views:BaseReadArray<ModelWriteValue<V>>,index:number){
	for(let i=index;i<views.size();i++){
		views.get(i).index(i)
	}
}
/**
 * 移动时更新计数
 * @param views 
 * @param oldIndex 
 * @param newIndex 
 */
function moveUpdateIndex<V>(views:BaseReadArray<ModelWriteValue<V>>,oldIndex:number,newIndex:number){
	const sort=oldIndex<newIndex?[oldIndex,newIndex]:[newIndex,oldIndex];
	for(let i=sort[0];i<=sort[1];i++){
		views.get(i).index(i)
	}
}

/**
 * 最终的卸载
 * @param views 
 * @param model 
 * @param theView 
 */
function destroyViews<V,T>(views:BaseArray<ModelWriteValue<V>>,model:mve.CacheArrayModel<T>,theView:mve.ArrayModelView<T>){
	const size=views.size()
	for(let i=size-1;i>-1;i--){
		views.get(i).destroy()
	}
	model.removeView(theView)
	views.clear()
}


class CacheModel<V> implements ModelWriteValue<V>{
	constructor(
		public readonly index:mve.Value<number>,
		public readonly value:V,
		public readonly clear?:()=>void
	){}
	destroy(){
		orRun(this.clear)
	}
}
function superModelCache<T,V>(
	views:BaseArray<CacheModel<V>>,
	model:mve.CacheArrayModel<T>,
	insert:(row:T,index:mve.GValue<number>)=>{row:V,destroy?():void}
){
	const theView:mve.ArrayModelView<T>={
		insert(index,row){
			const vindex=mve.valueOf(index)
			const vrow=insert(row,vindex)
			views.insert(index,new CacheModel(vindex,vrow.row,vrow.destroy))
			//更新计数
			initUpdateIndex(views,index)
		},
		remove(index){
			//模型减少
			const view=views.get(index)
			views.remove(index)
			if(view){
				//更新计数
				removeUpdateIndex(views,index)
				view.destroy()
			}
		},
		move(oldIndex,newIndex){
			//模型变更
			views.move(oldIndex,newIndex)
			//更新计数
			moveUpdateIndex(views,oldIndex,newIndex)
		}
	}
	model.addView(theView)
	return function(){
		destroyViews(views,model,theView)
	}
}
/**
 * 从一个model到另一个model，可能有销毁事件
 * @param model 
 * @param insert 
 */
export function modelCache<T,V>(
	model:mve.CacheArrayModel<T>,
	insert:(row:T,index:mve.GValue<number>)=>{row:V,destroy?():void},
){
	const views=mve.arrayModelOf<CacheModel<V>>([])
	return {
		views:views as ModelCacheChildren<V>,
		destroy:superModelCache<T,V>(views,model,insert)
	}
}
class ViewModel<V> implements ModelWriteValue<V>{
  constructor(
		public readonly index:mve.Value<number>,
		public readonly value:V,
		private readonly life:mve.LifeModelReturn,
		private readonly result:BuildResult
  ){}
  init(){
		orInit(this.result)
  }
  destroy(){
		this.life.destroy()
		orDestroy(this.result)
  }
}
export interface ModelChildrenRenderReturn<V,JO,EO>{
	data:V
	element:JOChildren<JO,EO>
}
function superModelChildren<T,V,JO,EO>(
	views:BaseArray<ViewModel<V>>,
	model:mve.CacheArrayModel<T>,
	fun:(me:mve.LifeModel,row:T,index:mve.GValue<number>)=>ModelChildrenRenderReturn<V,JO,EO>
):JOChildFun<JO,EO>{
	return function(buildChildren,parent){
		const life=onceLife({
			init(){
				const size=views.size()
				for(let i=0;i<size;i++){
					views.get(i).init()
				}
			},
			destroy(){
				destroyViews(views,model,theView)
			}
		})
		const theView:mve.ArrayModelView<T>={
			insert(index,row){
				const vindex=mve.valueOf(index)
				const lifeModel=mve.newLifeModel()
				const cs=fun(lifeModel.me,row,vindex)
				//创建视图
				const vm=parent.newChildAt(index)
				const vx=buildChildren(lifeModel.me,cs.element,vm)
				const view=new ViewModel<V>(vindex,cs.data,lifeModel,vx)
				//模型增加
				views.insert(index,view)
				//更新计数
				initUpdateIndex(views,index)
				//初始化
				if(life.isInit){
					view.init()
				}
			},
			remove(index){
				//模型减少
				const view=views.get(index)
				views.remove(index)
				if(view){
					//视图减少
					parent.remove(index)
					//更新计数
					removeUpdateIndex(views,index)
					//销毁
					if(life.isInit){
						view.destroy()
					}
				}
			},
			move(oldIndex,newIndex){
				//模型变更
				views.move(oldIndex,newIndex)
				//视图变更
				parent.move(oldIndex,newIndex)
				//更新计数
				moveUpdateIndex(views,oldIndex,newIndex)
			}
		}
		model.addView(theView)
		return life.out
	}
}
/**
 * 从model到视图 
 * @param model 
 * @param fun 
 */
export function modelChildren<T,JO,EO>(
  model:mve.CacheArrayModel<T>,
	fun:(me:mve.LifeModel,row:T,index:mve.GValue<number>)=>JOChildren<JO,EO>
):JOChildFun<JO,EO>{
	return superModelChildren([],model,function(me,row:T,index){
		return {
			data:null,
			element:fun(me,row,index)
		}
	})
}
/**
 * 从model到带模型视图
 * @param model 
 * @param fun 
 */
export function modelCacheChildren<T,V,JO,EO>(
  model:mve.CacheArrayModel<T>,
	fun:(me:mve.LifeModel,row:T,index:mve.GValue<number>)=>ModelChildrenRenderReturn<V,JO,EO>
){
	const views=mve.arrayModelOf<ViewModel<V>>([])
	return {
		views:views as ModelCacheChildren<V>,
		children:superModelChildren(views,model, fun)
	}
}