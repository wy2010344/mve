({
	/**
	*
	model
	build
	insertChildBefore(new_view,old_view)
	appendChild(view)
	removeChild(view)
	init(view)
	destroy(view)
	*/
	success:function(p){
        var views=[];
        var view={
            insert:function(index,row){
                //动态加载
                var view=p.build(row,i);
                views.splice(index,0,view);
                for(var i=index+1;i<views.length;i++){
                    views[i].row.index(i+1);
                }
                if(index<views.length-1){
                    /*移动到前面*/
                    p.insertChildBefore(view,views[index+1]);
                }
                p.init(view);
            },
            remove:function(index){
                //动态删除
                var view=views[index];
                views.splice(index,1);
                for(var i=index;i<views.length;i++){
                    views[i].row.index(i-1);
                }
                p.destroy(view);
                p.removeChild(view);
            }
        };
        p.model.addView(view);
        var initViews=[];
        for(var i=0;i<p.model.size();i++){
            var row=p.model.get(i);
            var view=p.build(row,i);
            views.push(view);
            p.appendChild(view);
            initViews.push(view);
        }

        return {
        	init:function(){
        		mb.Array.forEach(initViews,p.init);
        	},
        	destroy:function(){
	            mb.Array.forEach(views,p.destroy);
	            p.model.removeView(view);
        	}
        };
	}
})