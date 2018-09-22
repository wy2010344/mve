({
    /**
     * 改变行的data()，需要逆向改变数组
     */
    success:function(Value,Watcher,DOM,nokey){
        var build=function(repeat,mvvm){
            return function(row,i){
                var o={
                    data:Value(row),
                    index:Value(i)
                };
                var value={
                    row:o,
                    obj:mvvm(function(me){
                        return {
                            element:function(){
                                return repeat(o);
                            }
                        };
                    })
                };
                return value;
            };
        };
        var buildChildren=function(pel,children,inits,destroys,mvvm){
            var c_inits=[];
            var isInit=false;
            var bc=nokey({
                build:build(children.repeat,mvvm),
                after:function(value){
                    if(isInit){
                        //直接初始化
                        if(value.obj.init){
                            value.obj.init();
                        }
                    }else{
                        //附加于父层去初始化
                        if(value.obj.init){
                            c_inits.push(value.obj.init);
                        }
                    }
                },
                update_data:function(value,v){
                    value.row.data(v);
                },
                destroy:function(value){
                    value.obj.destroy();
                },
                appendChild:function(value){
                    DOM.appendChild(pel,value.obj.getElement());
                },
                removeChild:function(value){
                    DOM.removeChild(pel,value.obj.getElement());
                }
            });
            /*
            暂时不考虑区分 
            if (children.key) {
                //bc=lib.key(p,parseRow,buildOne,pel,children);
            }else{
            }
            */

            var watch=Watcher({
                exp:function(){
                    return children.array();
                },
                after:function(array){
                    bc.after(array);
                }
            });
            //初始化、销毁附加到全局
            inits.push(function() {
                mb.Array.forEach(c_inits,function(c_i) {
                    c_i();
                });
                isInit=true;
            });
            destroys.push(function() {
                watch.disable();
                bc.destroy();
            });
        };
        return buildChildren;
    }
});