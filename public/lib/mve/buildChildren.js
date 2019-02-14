({
    data:{
        buildArray:"./buildArray.js",
        buildModel:"./buildModel.js"
    },
    /**
     * 改变行的data()，需要逆向改变数组
     依赖父元素，mve返回是一个函数function(pel){obj}，函数接受父的初始化后，才能成为实体
     Value
     Watcher
     key
     appendChild(pel,el)
     insertChildBefore(pel,new_el,old_el)
     removeChild(pel,el)
     before 可选
     after 可选
     */
    success:function(p){
        var build=function(e,repeat,mve,getO){
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
        };
        var getOArray=function(row,i){
            return {
                data:p.Value(row),
                index:p.Value(i)
            };
        };
        var getOModel=function(row,i){
            return {
                data:row,
                index:p.Value(i)
            };
        };
        var p_before=p.before||mb.Function.quote.one;
        var p_after=p.after||mb.Function.quote.one;
        /**
        e {
            pel
            replaceChild(pel,old,new);
        }
        */
        var buildChildren=function(e,x,o){
            var children=o.json[p.key];
            if(children){
                if(typeof(children)=="object"){
                    var inits=o.inits;
                    var destroys=o.destroys;
		            if(mb.Array.isArray(children)){
		                //列表
		                return mb.Array.reduce(
		                	children,
		                	function(init,child){
		                		var obj=x.Parse(x,{
                                    json:child,
                                    e:e,
                                    k:init.k,
                                    inits:init.inits,
                                    destroys:init.destroys
                                });
                                p.appendChild(e.pel,obj.element);
                                return obj;
		                	},
		                	{
		                		k:o.k,
		                		inits:inits,
		                		destroys:destroys
		                	}
		                );
		            }else{
                        if(children.array){
    		                //计算
                            var c_inits=[];
    		                var isInit=false;
    		                var bc=lib.buildArray({
                                no_cache:p.no_cache,
    		                    build:build(e,children.repeat,x.mve,getOArray),
    		                    after:function(view){
                                    var init=view.obj.init;
    		                        if(isInit){
    		                            init();
    		                        }else{
                                        c_inits.push(init);
    		                        }
    		                    },
    		                    update_data:function(view,v){
    		                    	view.row.data(v);
    		                    },
    		                    destroy:function(view){
    		                    	view.obj.destroy();
    		                    },
    		                    appendChild:function(view){
                                    p.appendChild(e.pel,view.obj.getElement());
    		                    },
    		                    removeChild:function(view){
                                    p.removeChild(e.pel,view.obj.getElement());
    		                    }
    		                });
                            var watch=p.Watcher({
                            	before:function(){
                            		p_before(e.pel);
                            	},
                                exp:function(){
                                	return children.array();
                                },
                                after:function(array){
                                	bc.after(array);
                                	p_after(e.pel);
                                }
                            });
                            inits.push(function(){
                                mb.Array.forEach(c_inits,function(c_i){
                                    c_i();
                                });
                                isInit=true;
                            });
                            destroys.push(function(){
                                 watch.disable();
                                 bc.destroy();
                            });
                            return {
                            	k:o.k,
                            	inits:inits,
                            	destroys:destroys
                            };
                        }else 
                        if(children.model){
                            //model属性
                            var bm=lib.buildModel({
                                build:build(e,children.repeat,x.mve,getOModel),
                                model:children.model,
                                insertChildBefore:function(new_view,old_view){
                                    p.insertChildBefore(e.pel,new_view.obj.getElement(),old_view.obj.getElement());
                                },
                                removeChild:function(view){
                                    p.removeChild(e.pel,view.obj.getElement());
                                },
                                appendChild:function(view){
                                    p.appendChild(e.pel,view.obj.getElement());
                                },
                                init:function(view){
                                    view.obj.init();
                                },
                                destroy:function(view){
                                    view.obj.destroy();
                                }
                            });
                            inits.push(bm.init);
                            destroys.push(bm.destroy);
                            return {
                                k:o.k,
                                inits:inits,
                                destroys:destroys
                            };
                        }else{
                            mb.log("非array和model");
                            return o;
                        }
		            }  
                }else{
                    mb.log("错误children应该是字典或列表");
                }
            }else{
            	return o;
            }
        };
        return buildChildren;
    }
});