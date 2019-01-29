({
    data:{
        nokey:"./nokey.js"
    },
    /**
     * 改变行的data()，需要逆向改变数组

     Value
     Watcher
     key
     appendChild
     removeChild
     before 可选
     after 可选
     */
    success:function(p){
        var build=function(repeat,mve){
            return function(row,i){
                var o={
                    data:p.Value(row),
                    index:p.Value(i)
                };
                var value={
                    row:o,
                    obj:mve(function(me){
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
        var p_before=p.before||mb.Function.quote.one;
        var p_after=p.after||mb.Function.quote.one;
        var buildChildren=function(pel,x,o){
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
                                init.json=child;
                                var obj=x.Parse(x,init);
                                p.appendChild(pel,obj.element);
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
                            build:build(children.repeat,x.mve),
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
                                p.appendChild(pel,value.obj.getElement());
                            },
                            removeChild:function(value){
                                p.removeChild(pel,value.obj.getElement());
                            }
                        });
                        /*
                        暂时不考虑区分 
                        if (children.key) {
                            //bc=lib.key(p,parseRow,buildOne,pel,children);
                        }else{
                        }
                        */
                        var watch=p.Watcher({
                            before:function(){
                                p_before(pel);
                            },
                            exp:function(){
                                return children.array();
                            },
                            after:function(array){
                                bc.after(array);
                                p_after(pel);
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
                }
            }else{
                return o;
            }
        };
        return buildChildren;
    }
});