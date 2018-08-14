({
    /**
     * 不再使用getElement，而从参数传入父节点
     * DOM
     * buildChildren;
     */
    delay:true,
    success:function(){
        var bind=function(watch,value,f){
            if(typeof(value)=="function"){
                //observe
                watch({
                    exp:function(){
                        return value();
                    },
                    after:function(v){
                        f(v);
                    }
                });
            }else{
                f(value);
            }
        };
        var bindKV=function(watch,key,value,f){
            bind(watch,value,function(v){
                f(key,v);
            });
        };
        var bindMap=function(watch,map,f){
            if(map){
                mb.Object.forEach(map,function(v,k){
                    bindKV(watch,k,v,f);
                });
            }
        };
        var bindEvent=function(map,f){
            if(map){
                mb.Object.forEach(map,function(v,k){
                    f(k,v);
                });
            }
        };

        var build_locsize=function(locsize,json,fun) {
            mb.Array.forEach(locsize, function(str){
                var vf=json[str];
                if(vf!=undefined){
                    fun(str,vf)
                }
            });
        };

        return function(DOM,buildChildren,locsize){
            var ParseFunc=function(func,watch,inits,destroys,mvvm){
                var obj;
                var change=function() {
                    if (arguments.length==0) {
                        return obj;
                    }else{
                        obj=arguments[0];
                    }
                };
                watch({
                    exp:function(){
                       return func(); 
                    },
                    after:function(jo){
                        var newObj=mvvm(function(){
                            return {
                                element:jo
                            };
                        });
                        var obj=change();
                        if(obj){
                            //非第一次生成
                            DOM.replaceWith(obj.getElement(),newObj.getElement());
                            if(obj.destroy){
                                obj.destroy();
                            }
                            if(newObj.init){
                                newObj.init();
                            }
                        }else{
                            //第一次生成
                            if(newObj.init){
                                inits.push(newObj.init);
                            }
                        }
                        change(newObj);
                    }
                });
                //最后一个销毁
                destroys.push(function() {
                    var destroy=change().destroy||mb.emptyFunc;
                    destroy();
                });
                return change;
            };
            var ParseEL=function(json,watch,k,inits,destroys,mvvm){
                if(!json){
                    json="";
                }
                if(typeof(json)=="function"){
                    return ParseFunc(json,watch,inits,destroys,mvvm)().getElement();
                }else
                if(typeof(json)!="object"){
                    return DOM.createTextNode(json);
                }else{
                    var el;
                    var type=json.type;
                    var children=json.children;
                    var id=json.id;
                    if(typeof(type)=="string"){
                        el=DOM.createElement(type,json.NS);
                        if(id){
                            k[id]=el;
                        }
                        if(children){
                            if(typeof(children)=="object"){
                                if(mb.Array.isArray(children)){
                                    mb.Array.forEach(children,function(child,i){
                                        DOM.appendChild(
                                            el,
                                            ParseEL(child,watch,k,inits,destroys,mvvm)
                                        );
                                    });
                                }else{
                                    /**
                                     * v-for语句
                                     */
                                    buildChildren(el,children,inits,destroys,mvvm);
                                }
                            }
                        }
                        //
                        build_locsize(locsize,json,function(str,vf){
                            bind(watch,vf,function(v){
                                DOM.style(el,str,v+"px");
                            });
                        });
                    }else{
                        var obj=type(json.params||{});
                        if(id){
                            k[id]=obj;
                        }
                        el=obj.getElement();
                        //
                        build_locsize(locsize,json,function(str,vf) {
                            var ef=obj[str]||mb.emptyFunc;//兼容jsdom
                            bind(watch,vf,function(v){
                                ef(v);
                                DOM.style(el,str,v+"px");
                            });
                        });
                        if(obj.init){
                            inits.push(obj.init);
                        }
                        if(obj.destroy){
                            destroys.push(obj.destroy);
                        }
                    }
                    
                    bindMap(watch,json.attr,function(key,value){
                        DOM.attr(el,key,value);
                    });
                    
                    bindMap(watch,json.prop,function(key,value){
                        DOM.prop(el,key,value);
                    });
                    
                    bindMap(watch,json.style,function(key,value){
                        DOM.style(el,key,value);
                    });
                    
                    bindEvent(json.action,function(key,value){
                        DOM.action(el,key,value);
                    });
                    
                    var text=json.text;
                    if(text){
                        bind(watch,text,function(value){
                            DOM.text(el,value);
                        });
                    }
                    
                    var value=json.value;
                    if(value){
                        bind(watch,value,function(value){
                            DOM.value(el,value);
                        });
                    }  
                    var html=json.html;
                    if(html){
                        bind(watch,html,function(html){
                            DOM.html(el,html);
                        });
                    }
                    return el;
                };
            };
        
            /**
             * 不再使用getElement，直接传入父节点。
             * 完全不知道什么时候结束的。
             */
            var Parse=function(json,watch,k,mvvm){
                var inits=[];
                var destroys=[];
                var getElement;
                if(typeof(json)=='function'){
                    //根是function，要更新最新的el。
                    var obj=ParseFunc(json,watch,inits,destroys,mvvm);
                    getElement=function() {
                        return obj().getElement();
                    };
                }else{
                    var el=ParseEL(json,watch,k,inits,destroys,mvvm);
                    getElement=function(){
                        return el;
                    };
                }
                return {
                    getElement:getElement,
                    init:function() {
                        mb.Array.forEach(inits,function(x) {
                            x();
                        });
                    },
                    destroy:function() {
                        mb.Array.forEach(destroys,function(x) {
                            x();
                        });
                    }
                }
            };
            return Parse;
        }
    }
});