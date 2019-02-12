({
    data:{
        nokey:"./nokey.js"
    },
    /**
     * 改变行的data()，需要逆向改变数组
     no_cache:false
     Value
     Watcher
     key
     appendChild
     removeChild
     before 可选
     after 可选
     */
    success:function(p){
        var build=function(e,repeat,mve){
            return function(row,i){
                var o={
                    data:p.Value(row),
                    index:p.Value(i)
                };
                var fn=mve(function(me){
                    return {
                        element:function(){
                            /**
                            尽量避免repeat的生成受模型的影响，否则导致全生成。
                            */
                            return repeat(o);
                        }
                    };
                });
                var value={
                    row:o,
                    obj:fn(e)
                };
                return value;
            };
        };
        var p_before=p.before||mb.Function.quote.one;
        var p_after=p.after||mb.Function.quote.one;
        /**
        e{pel,replaceChild}
        */
        var buildChildren=function(e,x,o){
            var children=o.json[p.key];
            if(children){
                if(typeof(children)=='object') {
                    var inits=o.inits;
                    var destroys=o.destroys;
                    if (mb.Array.isArray(children)) {
                        //普通的
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
                        //非普通的
                        var c_inits=[];
                        var isInit=false; 
                        var bc=lib.nokey({
                            no_cache:p.no_cache,
                            build:build(e,children.repeat,x.mve),
                            after:function(value){
                                var init=value.obj.init;
                                if(isInit){
                                    //直接初始化
                                    init();
                                }else{
                                    //附加于父层去初始化
                                    c_inits.push(init);
                                }
                            },
                            update_data:function(value,v){
                                value.row.data(v);
                            },
                            destroy:function(value){
                                value.obj.destroy();
                            },
                            appendChild:function(value){
                                p.appendChild(e.pel,value.obj.getElement());
                            },
                            removeChild:function(value){
                                p.removeChild(e.pel,value.obj.getElement());
                            }
                        });
                        /*
                        暂时不考虑区分 
                        if (children.key) {
                            //bc=lib.key(p,parseRow,buildOne,e.pel,children);
                        }else{
                        }
                        */
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
                        return {
                            k:o.k,
                            inits:inits,
                            destroys:destroys
                        };
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