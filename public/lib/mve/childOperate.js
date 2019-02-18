({
	delay:true,
	success:function(){
		return {
			build:function(e,repeat,mve,getO){
	            return function(row,i){
	                var o=getO(row,i);
	                var fn=mve(function(me){
	                    return {
	                        element:function(){
	                            /**
	                            尽量避免repeat的生成受模型的影响，否则导致全生成。
	                            */
	                            return repeat(o);
	                        }
	                    }
	                });
	                var value={
	                    row:o,
	                    obj:fn(e)
	                };
	                return value;
	            };
	        },
	        getInit:function(view){
	        	return view.obj.init;
	        },
			init:function(view){
            	view.obj.init();
            },
			destroy:function(view){
                view.obj.destroy();
			}
		}
	}	
})