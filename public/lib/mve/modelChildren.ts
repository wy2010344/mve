import { baseChildrenBuilder, EOChildFun, EOChildren } from "./childrenBuilder";
import { BuildResult, mve, onceLife, orRun, orInit, orDestroy } from "./util";

export interface ModelCacheValue<V>{
	readonly index:mve.GValue<number>
	readonly value:V
}
export type ModelCacheChildren<V>=mve.CacheArrayModel<ModelCacheValue<V>>

export interface ModelWriteValue<V> extends ModelCacheValue<V>{
	index:mve.Value<number>
	destroy():void
}

/**
 * 初始化更新计数
 * @param views 
 * @param index 
 */
export function initUpdateIndex<V>(views:BaseReadArray<ModelWriteValue<V>>,index:number){
	for(let i=index+1;i<views.size();i++){
		views.get(i).index(i)
	}
}
/**
 * 删除时更新计算
 * @param views 
 * @param index 
 */
export function removeUpdateIndex<V>(views:BaseReadArray<ModelWriteValue<V>>,index:number){
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
export function moveUpdateIndex<V>(views:BaseReadArray<ModelWriteValue<V>>,oldIndex:number,newIndex:number){
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


function getCacheModel<V>(pDestroy?:(v:V)=>void){
	class CacheModel<V> implements ModelWriteValue<V>{
		constructor(
			public readonly index:mve.Value<number>,
			public readonly value:V
		){}
		destroy(){}
	}
	if(pDestroy){
		CacheModel.prototype.destroy=function(){
			pDestroy(this.value)
		}
	}
	return function(index:mve.Value<number>,value:V){
		return new CacheModel(index,value)
	}
}
function superModelCache<T,V>(
	views:BaseArray<ModelWriteValue<V>>,
	model:mve.CacheArrayModel<T>,
	insert:(row:T,index:mve.GValue<number>)=>V,
	destroy?:(v:V)=>void
){
	const cacheModel=getCacheModel(destroy)
	const theView:mve.ArrayModelView<T>={
		insert(index,row){
			const vindex=mve.valueOf(index)
			const vrow=insert(row,vindex)
			views.insert(index,cacheModel(vindex,vrow))
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

////////////////////////////////////////////从一个模型到另一个模型///////////////////////////////////

export interface ModelCacheReturn<V>{
	views:ModelCacheChildren<V>
	destroy():void
}
/**
 * 从一个model到另一个model，可能有销毁事件
 * 应该是很少用的，尽量不用
 * 可以直接用CacheArrayModel<T>作为组件基础参数，在组件需要的字段不存在时，入参定义T到该字段的映射
 * @param model 
 * @param insert 
 */
export function modelCache<T,V>(
	model:mve.CacheArrayModel<T>,
	insert:(row:T,index:mve.GValue<number>)=>V,
	destroy?:(v:V)=>void
):ModelCacheReturn<V>{
	const views=mve.arrayModelOf<ModelWriteValue<V>>([])
	return {
		views:views as ModelCacheChildren<V>,
		destroy:superModelCache<T,V>(views,model,insert,destroy)
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
function superModelChildren<T,V,F,EO>(
	views:BaseArray<ViewModel<V>>,
	getElement:(f:F)=>EOChildren<EO>,
	getData:(f:F)=>V,
	model:mve.CacheArrayModel<T>,
	fun:(me:mve.LifeModel,row:T,index:mve.GValue<number>)=>F
):EOChildFun<EO>{
	return function(parent,me){
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
				const vx=baseChildrenBuilder(lifeModel.me,getElement(cs),vm)
				const view=new ViewModel<V>(vindex,getData(cs),lifeModel,vx)
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
////////////////////////////////////////////通用方式////////////////////////////////////////////////
function emptyGet(){}
function quoteGet<T>(v:T){return v}
/**
 * 从model到视图 
 * @param model 
 * @param fun 
 */
export function modelChildren<T,EO>(
  model:mve.CacheArrayModel<T>,
	fun:(me:mve.LifeModel,row:T,index:mve.GValue<number>)=>EOChildren<EO>
):EOChildFun<EO>{
	return superModelChildren([],quoteGet,emptyGet,model,fun)
}
///////////////////////////////////////////一种方式/////////////////////////////////////////////////
export interface ModelChildrenRenderReturn<V,EO>{
	data:V
	element:EOChildren<EO>
}
function renderGetElement<V,EO>(v:ModelChildrenRenderReturn<V,EO>){
	return v.element
}
function renderGetData<V,EO>(v:ModelChildrenRenderReturn<V,EO>){
	return v.data
}
/**
 * 从model到带模型视图
 * 应该是很少用的，尽量不用
 * @param model 
 * @param fun 
 */
export function modelCacheChildren<T,V,EO>(
  model:mve.CacheArrayModel<T>,
	fun:(me:mve.LifeModel,row:T,index:mve.GValue<number>)=>ModelChildrenRenderReturn<V,EO>
){
	const views=mve.arrayModelOf<ViewModel<V>>([])
	return {
		views:views as ModelCacheChildren<V>,
		children:superModelChildren(views,renderGetElement,renderGetData,model, fun)
	}
}