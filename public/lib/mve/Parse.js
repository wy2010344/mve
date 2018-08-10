({
    baseUrl:cp.libUrl(),
    data:{
        parse_base:"mve/parse/index.js"
    },
    delay:true,
    success:function(){
        return lib.parse_base({
            createElement:function(type,NS){
                if(NS){
                    return document.createElementNS(NS,type);
                }else{
                    return document.createElement(type);
                }
            },
            createTextNode:function(json){
                return document.createTextNode(json);
            },
            appendChild:function(el,child){
                el.appendChild(child);
            },
            replaceWith:function(el,newEL){
                var pN=el.parentNode;
                if(pN){
                    pN.replaceChild(newEL,el);
                }
            },
            removeChild:function(el,child){
                el.removeChild(child);
            },
            attr:function(el,key,value){
                if(value==undefined){
                    el.removeAttribute(key);
                }else{
                    el.setAttribute(key,value);
                }
            },
            style:function(el,key,value){
                //IE下如果设置负值，会导致错误
                try{
                    el.style[key]=value;
                }catch(e){
                    mb.log(e);
                }
            },
            prop:function(el,key,value){                
                el[key]=value;
            },
            action:function(el,key,value){
                mb.DOM.addEvent(el,key,value);
            },
            text:function(el,value){
                el.innerText=value;
            },
            value:function(el,value){
                el.value=value;
            },
            html:function(el,value) {
                el.innerHTML=value;
            }
        });
    }
});