({
    data:{
        mve:"../mve/index.js",
        exp:"../mve-out/exp.js",
        buildChildren:"../mve-out/buildChildren.js",
        parse:"../mve-out/parse.js",
        DOM:"./DOM.js"
    },
    success:function(){
        /**
         * repeat生成json结果是被观察的，受哪些影响，重新生成，替换原来的节点。
         * 生成过程，而json叶子结点里的函数引用，如style,attr，则受具体的影响
         */
        var buildChildren=lib.buildChildren({
            Value:lib.mve.Value,
            Watcher:lib.mve.Watcher,
            key:"children",
            appendChild:lib.DOM.appendChild,
            removeChild:lib.DOM.removeChild
        });
        var bindEvent=function(map,f){
            if(map){
                mb.Object.forEach(map,function(v,k){
                    f(k,v);
                });
            }
        };
        var bindKV=function(bind,key,value,f){
            bind(value,function(v){
                f(key,v);
            });
        };
        var bindMap=function(bind,map,f){
            if(map){
                mb.Object.forEach(map,function(v,k){
                    bindKV(bind,k,v,f);
                });
            }
        };
        return lib.exp(
            lib.parse(
                lib.mve.locsize,
                {
                    locsize:function(e,str,v){
                        lib.DOM.style(e,str,v?v+"px":"");
                    },
                    createTextNode:function(x,o){
                        return {
                            element:lib.DOM.createTextNode(o.json||""),
                            k:o.k,
                            inits:o.inits,
                            destroys:o.destroys
                        };
                    },
                    replaceWith:lib.DOM.replaceWith,
                    buildElement:function(x,o){
                        var e=lib.DOM.createElement(o.json.type,o.json.NS);
                        var obj=buildChildren(e,x,o);
                        return {
                            element:e,
                            k:obj.k,
                            inits:obj.inits,
                            destroys:obj.destroys
                        };
                    },
                    makeUpElement:function(e,x,json){ 
                        bindMap(x.bind,json.attr,function(key,value){
                            lib.DOM.attr(e,key,value);
                        });
                        
                        bindMap(x.bind,json.prop,function(key,value){
                            lib.DOM.prop(e,key,value);
                        });
                        
                        bindMap(x.bind,json.style,function(key,value){
                            lib.DOM.style(e,key,value);
                        });
                        
                        bindEvent(json.action,function(key,value){
                            lib.DOM.action(e,key,value);
                        });
                        
                        x.if_bind(json.text,function(value){
                            lib.DOM.text(e,value);
                        });
                        
                        x.if_bind(json.value,function(value){
                            lib.DOM.value(e,value);
                        });

                        x.if_bind(json.html,function(html){
                            lib.DOM.html(e,html);
                        });
                    }
                }
            )
        );
    }
});