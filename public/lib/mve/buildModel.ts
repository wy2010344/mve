import { ChildViewModel } from "./model";

interface MView{
	insert(index:number,row):void;
	remove(index:number):void;
	move(old_index:number,new_index:number):void;
};
/**
*
build
model
update_index(view,index);
insertChildBefore(new_view,old_view)
appendChild(view)
removeChild(view)
init(view)
destroy(view)
*/
export=function(p:{
	model:{
		size():number;
		get(index:number):MView;
		addView(view:MView):void;
		removeView(view:MView):void;
	},
	build(row,index:number):any;
	update_index(view:ChildViewModel,index:number):any;
	insertChildBefore(view:ChildViewModel,view_old:ChildViewModel,isMove?:boolean):void;
	appendChild(view:ChildViewModel,isMove?:boolean):void;
	init(view:ChildViewModel):void;
	destroy(view:ChildViewModel):void;
	removeChild(view:ChildViewModel):void;
}){
	const views:ChildViewModel[]=[];
	const view:MView={
		insert(index,row){
			//动态加载
			var view=p.build(row,index);
			views.splice(index,0,view);
			for(var i=index+1;i<views.length;i++){
				p.update_index(views[i],i);
			}
			if(index<views.length-1){
				/*移动到前面*/
				p.insertChildBefore(view,views[index+1]);
			}else{
				p.appendChild(view)
			}
			p.init(view);
		},
		remove(index){
			//动态删除
			var view=views[index];
			views.splice(index,1);
			for(var i=index;i<views.length;i++){
				p.update_index(views[i],i);
			}
			p.destroy(view);
			p.removeChild(view);
		},
		move(old_index,new_index){
			const view=views[old_index];
			views.splice(old_index,1);
			views.splice(new_index,0,view);

			const sort=old_index<new_index?[old_index,new_index]:[new_index,old_index];
			for(var i=sort[0];i<=sort[1];i++){
				p.update_index(views[i],i);
			}
			
			if (new_index<views.length-1) {
				p.insertChildBefore(view,views[new_index+1],true);
			}else{
				p.appendChild(view,true);
			}
		}
	};
	p.model.addView(view);
	const initViews=[];
	for(var i=0;i<p.model.size();i++){
		const row=p.model.get(i);
		const view=p.build(row,i);
		views.push(view);
		p.appendChild(view);
		initViews.push(view);
	}

	return {
		firstElement(){
			const view=views[0];
			if(view){
				return view.obj.element;
			}
		},
		init(){
			mb.Array.forEach(initViews,p.init);
		},
		destroy(){
			mb.Array.forEach(views,p.destroy);
			p.model.removeView(view);
		}
	};
}