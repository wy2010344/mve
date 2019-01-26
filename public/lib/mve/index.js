({
    data:{
        util:"./parse/util.js",
        buildChildren:"./parse/buildChildren.js",
        nokey:"./parse/nokey.js",
        parse:"./parse/index.js",
        DOM:"./DOM.js"
    },
    success:function(){
        /**
         * repeat生成json结果是被观察的，受哪些影响，重新生成，替换原来的节点。
         * 生成过程，而json叶子结点里的函数引用，如style,attr，则受具体的影响
         */
        var buildChildren=lib.buildChildren({
            Value:lib.util.Value,
            Watcher:lib.util.Watcher,
            key:"children",
            appendChild:lib.DOM.appendChild,
            removeChild:lib.DOM.removeChild
        });
        return lib.util.Exp(
            lib.parse(
                lib.util.locsize,
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
                        x.bindMap(json.attr,function(key,value){
                            lib.DOM.attr(e,key,value);
                        });
                        
                        x.bindMap(json.prop,function(key,value){
                            lib.DOM.prop(e,key,value);
                        });
                        
                        x.bindMap(json.style,function(key,value){
                            lib.DOM.style(e,key,value);
                        });
                        
                        x.bindEvent(json.action,function(key,value){
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