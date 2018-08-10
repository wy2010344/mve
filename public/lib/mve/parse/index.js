({
    baseUrl:cp.libUrl(),
    data:{
        buildChildren:"mve/parse/buildChildren.js"
    },
    /**
     * 不再使用getElement，而从参数传入父节点
     * createElement
     * createText;
     */
    success:function(p){
        var bind=function(it,value,f){
            if(typeof(value)=="function"){
                //observe
                it.Watch({
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
        var bindKV=function(it,key,value,f){
            bind(it,value,function(v){
                f(key,v);
            });
        };
        var bindMap=function(it,map,f){
            if(map){
                mb.Object.forEach(map,function(v,k){
                    bindKV(it,k,v,f);
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
        var ParseFunc=function(func,me,mvvm,util,change){
            me.Watch({
                exp:function(){
                   return func(); 
                },
                after:function(jo){
                    var newObj=mvvm(function(me){
                        return {
                            element:jo
                        };
                    });
                    var obj=change();
                    if(obj){
                        //非第一次生成
                        p.replaceWith(obj.getElement(),newObj.getElement());
                        if(obj.destroy){
                            obj.destroy();
                        }
                        if(newObj.init){
                            newObj.init();
                        }
                    }else{
                        //第一次生成
                        util.buildAlive({
                            init:newObj.init,
                            destroy:function(){
                                if(newObj.destroy){
                                    newObj.destroy();//需要指向动态的newObj。
                                }
                            }
                        },me);
                    }
                    change(newObj);
                }
            });
        };
        var ParseEL=function(json,me,mvvm,buildChildren,util){
            if(!json){
                json="";
            }
            if(typeof(json)=="function"){
                var obj;
                ParseFunc(json,me,mvvm,util,function(){
                    if (arguments.length==0) {
                        return obj;
                    }else{
                        obj=arguments[0];
                    }
                });
                return obj.getElement();
            }else
            if(typeof(json)!="object"){
                return p.createTextNode(json);
            }else{
                var el;
                var type=json.type;
                var children=json.children;
                var id=json.id;
                if(typeof(type)=="string"){
                    el=p.createElement(type,json.NS);
                    if(id){
                        me.k[id]=el;
                    }
                    if(children){
                        if(typeof(children)=="object"){
                            if(mb.Array.isArray(children)){
                                mb.Array.forEach(children,function(child,i){
                                    p.appendChild(el,ParseEL(child,me,mvvm,buildChildren,util));
                                });
                            }else{
                                /**
                                 * v-for语句
                                 */
                                var bc=buildChildren(el,children);
                                util.buildAlive(bc,me);
                            }
                        }
                    }
                    
                    mb.Array.forEach(util.locsize, function(str){
                        var vf=json[str];
                        if(vf!=undefined){
                            bind(me,vf,function(v){
                                p.style(el,str,v+"px");
                            });
                        }
                    });
                }else{
                    var obj=type(json.params||{});
                    if(id){
                        me.k[id]=obj;
                    }
                    el=obj.getElement();
                    
                    mb.Array.forEach(util.locsize, function(str){
                        var vf=json[str];
                        if(vf!=undefined){
                            var ef=obj[str]||mb.emptyFunc;//兼容jsdom
                            bind(me,vf,function(v){
                                ef(v);
                                p.style(el,str,v+"px");
                            });
                        }
                    });
                    util.buildAlive(obj,me);
                }
                
                bindMap(me,json.attr,function(key,value){
                    p.attr(el,key,value);
                });
                
                bindMap(me,json.prop,function(key,value){
                    p.prop(el,key,value);
                });
                
                bindMap(me,json.style,function(key,value){
                    p.style(el,key,value);
                });
                
                bindEvent(json.action,function(key,value){
                    p.action(el,key,value);
                });
                
                var text=json.text;
                if(text){
                    bind(me,text,function(value){
                        p.text(el,value);
                    });
                }
                
                var value=json.value;
                if(value){
                    bind(me,value,function(value){
                        p.value(el,value);
                    });
                }  
                var html=json.html;
                if(html){
                    bind(me,html,function(html){
                        p.html(el,html);
                    });
                }
                return el;
            };
        };
    
        /**
         * 不再使用getElement，直接传入父节点。
         * 完全不知道什么时候结束的。
         */
        var Parse=function(json,me,mvvm,util){
            var el;
            var buildChildren=lib.buildChildren(mvvm,p,util);
            if(typeof(json)=='function'){
                //根是function，要更新最新的el。
                var obj;
                ParseFunc(json,me,mvvm,util.util,function(){
                    if(arguments.length==0){
                        return obj;
                    }else{
                        obj=arguments[0];
                        el=obj.getElement();
                    }
                });
            }else{
                el=ParseEL(json,me,mvvm,buildChildren,util.util);
            }
            return function(){
                return el;
            };
        };
        return Parse;
    }
});