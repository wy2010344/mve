({
    data:{
        nokey:"mve/parse/nokey.js"
    },
    /**
     * 改变行的data()，需要逆向改变数组
     */
    success:function(mvvm,DOM,util){
        var build=function(repeat){
            return function(row,i){
                var o={
                    data:util.Value(row),
                    index:util.Value(i)
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
        var buildChildren=function(pel,params){
            var bc=lib.nokey({
                build:build(params.repeat),
                after:function(value){
                    if(isInit){
                        //直接初始化
                        if(value.obj.init){
                            value.obj.init();
                        }
                    }else{
                        //附加于父层去初始化
                        util.util.buildInit(value.obj,me);
                    }
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
            if (params.key) {
                //bc=lib.key(p,parseRow,buildOne,pel,params);
            }else{
            }
            */
            var isInit=false;
            var me={
                init:function(){
                    isInit=true;
                },
                destroy:function(){
                    watch.disable();
                    bc.destroy();
                }
            };
            var watch=util.Watcher({
                exp:function(){
                    return params.array();
                },
                after:function(array){
                    bc.after(array);
                }
            });
            return me;
        };
        return buildChildren;
    }
});