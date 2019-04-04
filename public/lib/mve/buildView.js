({
	delay:true,
	success:function(){

		function ArrayView(p,models){
			this._models=models;
			this._p=p;
		}


		var move=function(from,to,from_index,to_index){
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
		};

        /*
            ArrayModel是模型内的批量移动，其实可以对应grid。

            在视图上的移动，一是移进缝隙，一是替换
            替换则向前移动，在前的前面，向后移动，在后的后面。故替换原来的index就行
            还有跨视图的移动，组件从一个视图移动到另一个视图，这是多个视图模型的交互。

            如果视图原生实现了控件的移动，则用此ArrayView，只要修改getModel里的顺序就行，通过get/insert/remove三个接口。而视图已经替换好了。
        */
        mb.Object.ember(ArrayView.prototype,{
        	getModel:function(){
        		return this._models;
        	},
        	/*这里的index是占位*/
        	moveTo:function(target,oldIndex,index){
        		move(this,target,oldIndex,index);
        	},
        	moveFrom:function(from,oldIndex,index){
        		move(from,this,oldIndex,index);
        	},
        	insert:function(index,row){
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
        	},
        	remove:function(index){
        		var p=this._p;
        		var models=this._models;

                var view=models[index].view;
                models.splice(index,1);

                for(var i=index;i<models.length;i++){
                    p.update_index(models[i].view,i-1);
                }

                p.destroy(view);
                p.removeChild(view);
        	},
        	//////
            size:function(){
                return this._models.length;
            },
            get:function(index){
                return this._models[index].model;
            },
            shift:function(){
                return this.remove(0);
            },
            unshift:function(row){
                return this.insert(0,row)
            },
            pop:function(){
                return this.remove(this.size()-1);
            },
            push:function(row){
                return this.insert(this.size(),row);
            },
            indexOf:function(row){
                return mb.Array.find_index(this._models,function(model){
                	return model.model==row;
                });
            }
        });
        /*
		model:[]
		build
		init
		destroy
        */
		return function(p){

			var models=[];
			var initModels=[];
			for(var i=0;i<p.model.length;i++){
				var view=p.build(p.model[i],i);
				var model={
					view:view,
					model:p.model[i]
				};
				models.push(model);
				p.appendChild(view);
            	initModels.push(model);
			}
			return {
				view:new ArrayView(p,models),
				init:function(){
					mb.Array.forEach(initModels,function(model){
						p.init(model.view);
					});
				},
				destroy:function(){
					mb.Array.forEach(models,function(model){
						p.destroy(model.view);
					});
				}
			}
		};
	}
})