({
	/*
	*这一版也不使用cache，为了兼容使用unshift?
    *build(row,i)=>{row:{data(),index()},obj,el}
    *appendChild
    *removeChild
    *after(value):新增的附加到父元素之后
	*/
	success:function(p) {
		var views=[];

        var update_views=function(array) {
            //更新视图上数据
            for(var i=0;i<views.length;i++){
                views[i].row.data(array[i]);
            }
        };

        return {
        	destroy:function() {
        		mb.Array.forEach(cache,function(c) {
        			// body...
        		})
        	}
        }
	}
})