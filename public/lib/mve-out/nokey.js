({
    /*
    *no_cache:false true表示无cache
    *build(row,i)=>{row:{data(),index()},obj,el}
    *update_data
    *destroy
    *appendChild
    *removeChild
    *after(value):新增的附加到父元素之后
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
                            var value=views.pop();
                            p.removeChild(value);
                            p.destroy(value);
                        }
                        update_views(array);
                    }else{               
                        update_views(array);
                        //新增加，同时增加进cache和views
                        for(var i=views.length;i<array.length;i++){
                            var value=p.build(array[i],i);
                            views.push(value);
                            p.appendChild(value);
                            p.after(value);
                        }
                    }
                }
            };
        }else{
            var cache=[];//缓存池
    		return {
    			destroy:function() {
    	           mb.Array.forEach(cache, p.destroy);
    			},
    			after:function(array){
                    /**
                     * 既然以数组序号，没必要清空所有
                     */
                    if(array.length<views.length){
                        //从视图上移除
                        while(views.length!=array.length){
                            var value=views.pop();
                            p.removeChild(value);
                        }
                        update_views(array);
                    }else
                    {
                        //向视图上增加，>
                        if(array.length<cache.length){
                            //cache向视图上增加
                            for(var i=views.length;i<array.length;i++){
                                var value=cache[i];
                                views.push(value);
                                p.appendChild(value);
                            }
                            update_views(array);
                        }else{
                            //从cache向视图上增加的部分
                            for(var i=views.length;i<cache.length;i++){
                                var value=cache[i];
                                views.push(value);
                                p.appendChild(value);
                            }
                            //更新cache的数据
                            update_views(array);
                            //新增加，同时增加进cache和views
                            for(var i=cache.length;i<array.length;i++){
                                var value=p.build(array[i],i);
                                cache.push(value);
                                views.push(value);
                                p.appendChild(value);
                                p.after(value);
                            }
                        }
                        
                    }
                    //重装
                }
    		};
        }
	}
});