({
    /*
    *build(row,i)=>{row:{data(),index()},obj,el}
    *appendChild
    *removeChild
    *after(value):新增的附加到父元素之后
    */
	success:function(p) {
        var cache=[];//缓存池
        var views=[];//在界面上的缓存池

        var update_views=function(array) {
            //更新视图上数据
            for(var i=0;i<views.length;i++){
                views[i].row.data(array[i]);
            }
        };
		return {
			destroy:function() {
				
	             mb.Array.forEach(cache, function(c){
	                 if(c.obj.destroy){
	                     c.obj.destroy();
	                 }
	             });
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
                
                /*
                mb.Array.forEach(array,function(row,i){
                    var value=cache[i];
                    var o,el;
                    if(value){
                        o=value.row;
                        el=value.el;
                        o.data(row);
                    }else{
                         o=parseRow({
                            data:row,
                            index:i
                        });
                        el=params.repeat(o);
                        value={
                            row:o,
                            el:el
                        };
                        cache[i]=value;
                    }
                    p.DOM.appendChild(pel,el);
                });
                */
            }
		};
	}
});