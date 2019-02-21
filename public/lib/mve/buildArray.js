({
    /*
    *build(row,i)=>{row:{data(),index()},obj,el}
    *after(value):新增的附加到父元素之后
    *no_cache:false true表示无cache
    *update_data
    *destroy
    *appendChild
    *removeChild
    */
	success:function(p) {
        var views=[];//在界面上的缓存池
        var update_views=function(array) {
            //更新视图上数据
            for(var i=0;i<views.length;i++){
                p.update_data(views[i],array[i])
            }
        };
        if(p.no_cache){
            return {
                destroy:function(){
                    mb.Array.forEach(views,p.destroy);
                },
                after:function(array){
                    if (array.length<views.length) {
                        while(views.length!=array.length){
                            var view=views.pop();
                            p.removeChild(view);
                            p.destroy(view);
                        }
                        update_views(array);
                    }else{               
                        update_views(array);
                        for(var i=views.length;i<array.length;i++){
                            var view=p.build(array[i],i);
                            views.push(view);
                            p.appendChild(view);
                            p.after(view);
                        }
                    }
                }
            };
        }else{
            var caches=[];//缓存池
    		return {
    			destroy:function() {
    	           mb.Array.forEach(caches, p.destroy);
    			},
    			after:function(array){
                    /**
                     * 既然以数组序号，没必要清空所有
                     */
                    if(array.length<views.length){
                        //从视图上移除
                        while(views.length!=array.length){
                            var view=views.pop();
                            p.removeChild(view);
                        }
                        update_views(array);
                    }else
                    {
                        //向视图上增加，>
                        if(array.length<caches.length){
                            //caches向视图上增加
                            for(var i=views.length;i<array.length;i++){
                                var view=caches[i];
                                views.push(view);
                                p.appendChild(view);
                            }
                            update_views(array);
                        }else{
                            //从caches向视图上增加的部分
                            for(var i=views.length;i<caches.length;i++){
                                var view=caches[i];
                                views.push(view);
                                p.appendChild(view);
                            }
                            //更新caches的数据
                            update_views(array);
                            //新增加，同时增加进caches和views
                            for(var i=caches.length;i<array.length;i++){
                                var view=p.build(array[i],i);
                                caches.push(view);
                                views.push(view);
                                p.appendChild(view);
                                p.after(view);
                            }
                        }
                        
                    }
                }
    		};
        }
	}
});