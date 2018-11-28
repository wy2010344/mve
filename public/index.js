({
    data:{
        conf:function(suc){
            mb.task.all({
                data:{
                    jsdom:function(notice){
                        mb.ajax.require({
                            url:cp.libUrl()+"jsdom.js",
                            notice:notice
                        });
                    },
                    mve:function(notice){
                        mb.ajax.require({
                            url:cp.libUrl()+"mve/index.js",
                            notice:notice,
                            baseUrl:cp.libUrl()
                        });
                    },
                    JSON:function(notice){
                        if(window.JSON){
                            notice(window.JSON);
                        }else{
                            mb.ajax.require.getTxt(cp.libUrl()+"json2.js",function(txt){
                                eval(txt);
                                notice(JSON);
                            });
                        }
                    }
                },
                success:suc
            });
        }
    },
    /**
     * init:最终执行的方法
     */
    success:function(p){
        window.JSON=lib.conf.JSON;
        window.jsdom=lib.conf.jsdom;
        window.mve=lib.conf.mve();
        p.init(function(success){
            var obj=success();
            var root=document.getElementById("root");
            var body=root.parentElement;
            
            var rpd;
            if(mb.DOM.isMobile() || mb.ext){
                rpd=0;
            }else{
                rpd=10;
            }
            root.style.padding=rpd+"px";
            if(obj.getElement){
                //传统的jsdom
                var el=obj.getElement();
                window.onresize=function(){
                    var _w=body.clientWidth-(rpd*2);
                    var _h=body.clientHeight-(rpd*2);
                    el.style.width=_w+'px';
                    el.style.height=_h+'px';
                    if(obj.height){
                        obj.height(_h);
                    }
                    if(obj.width){
                        obj.width(_w);
                    }
                };
                root.appendChild(el);
                if(obj.init){
                    obj.init();
                }
                window.onresize();
                if(obj.destroy){
                    mb.DOM.addEvent(window,"unload",function(){
                        obj.destroy();
                    });
                }
            }else{
                root.appendChild(obj);
            }
            mb.log("加载完成");
        });
    }
});