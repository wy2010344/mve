

interface ArrayViewParam{
	model:any[],
	build(model,i:number):any;
	appendChild(view):void;
	removeChild(view):void;
	insertChildBefore(view,old_voiew):void;
	update_index(view,i:number):void;
	init(view):void;
	destroy(view):void;
}
/*
ArrayModel是模型内的批量移动，其实可以对应grid。

在视图上的移动，一是移进缝隙，一是替换
替换则向前移动，在前的前面，向后移动，在后的后面。故替换原来的index就行
还有跨视图的移动，组件从一个视图移动到另一个视图，这是多个视图模型的交互。

如果视图原生实现了控件的移动，则用此ArrayView，只要修改getModel里的顺序就行，通过get/insert/remove三个接口。而视图已经替换好了。
*/

class ArrayView {
	private _models;
	private _p:ArrayViewParam;
	constructor(p:ArrayViewParam,models) {	
		this._models=models;
		this._p=p;
	}
	getModel(){
		return this._models;
	}
	static move(from:ArrayView,to:ArrayView,from_index:number,to_index:number){
		var model=from._models[from_index];
		from._models.splice(from_index,1);
		to._models.splice(to_index,0,model);
		//视图的移动
		from._p.removeChild(model.view);
		if(to_index<to.size()-1){
			to._p.insertChildBefore(model.view,to._models[to_index+1].view);
		}else{
			to._p.appendChild(model.view);
		}
	}
	/*这里的index是占位*/
	moveTo(target:ArrayView,oldIndex:number,index:number){
		ArrayView.move(this,target,oldIndex,index);
	}
	moveFrom(from:ArrayView,oldIndex:number,index:number){
		ArrayView.move(from,this,oldIndex,index);
	}
	insert(index:number,row){
		var p=this._p;
		var models=this._models;
		var view=p.build(row,index);

		var model={
			view:view,
			model:row
		};
		models.splice(index,0,model);
		for(var i=index+1;i<models.length;i++){
			p.update_index(models[i].view,i+1);
		}
		if(index<models.length-1){
			/*移动到前面*/
			p.insertChildBefore(view,models[index+1].view);
		}else{
			p.appendChild(view)
		}
		p.init(view);
	}
	remove(row){
		var index=this.indexOf(row);
		if(row>-1){
			this.removeAt(index);
		}
	}
	removeAt(index){
		var p=this._p;
		var models=this._models;

		var view=models[index].view;
		models.splice(index,1);

		for(var i=index;i<models.length;i++){
			p.update_index(models[i].view,i-1);
		}

		p.destroy(view);
		p.removeChild(view);
	}
	//////
	size(){
		return this._models.length;
	}
	get(index:number){
		return this._models[index].model;
	}
	shift(){
		return this.remove(0);
	}
	unshift(row){
		return this.insert(0,row)
	}
	pop(){
		return this.remove(this.size()-1);
	}
	push(row){
		return this.insert(this.size(),row);
	}
	indexOf(row){
		return mb.Array.find_index(this._models,function(model:any){
			return model.model==row;
		});
	}
}
/*
model:[]
build
init
destroy
*/
export=function(p:ArrayViewParam){
	const models=[];
	const initModels=[];
	for(var i=0;i<p.model.length;i++){
		const view=p.build(p.model[i],i);
		const model={
			view:view,
			model:p.model[i]
		};
		models.push(model);
		p.appendChild(view);
		initModels.push(model);
	}
	const arrayView=new ArrayView(p,models)
	return {
		view:arrayView,
		firstElement(){
			let model=arrayView.getModel()[0]
			if(model){
				return model.view.obj.element;
			}
		},
		init(){
			mb.Array.forEach(initModels,function(model){
				p.init(model.view);
			});
		},
		destroy(){
			mb.Array.forEach(models,function(model){
				p.destroy(model.view);
			});
		}
	}
};