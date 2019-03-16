'use strict';
window.mb={};
mb.Function=(function(){
    var quote=function(){
        return function(a){
            return a;
        }
    };
    quote.one=quote();
    var as_null=function(){
        return function(){
            return null;
        };
    };
    as_null.one=as_null();
    var list=function(){
        return function(){
            var r=[];
            for(var i=0;i<arguments.length;i++){
                r.push(arguments[i]);
            }
            return r;
        };
    };
    list.one=list();
    return {
        quote:quote,
        list:list,
        as_null:as_null
    };
})();
mb.log=(function(){
    if(window.console && window.console.log){
        try{
            var log=window.console.log;
            log("测试支持控制台");
            return log;
        }catch(e){
            mb.isIE=true;
            return mb.Function.list.one;
        }
    }else{
        return mb.Function.list.one;
    }
})();
mb.emptyFunc=function(item){
    mb.log("请调用mb.Function.quote/as_null/list或其one属性");
    return item;
};
var emptyFunc=mb.emptyFunc;
mb.cache=function(obj) {
    return function() {
        if(arguments.length==0){
            return obj;
        }else{
            obj=arguments[0];
        }
    };
};
mb.task={
    /**
     * 
     * 无顺序执行完
     * @param data
     * @param trans{
     * key,
     * value,
     * notice
     * }如果没有trans，data中的每一个就是带回调的函数
     * @param success
     */
    all:function(p){
        var success=p.success||mb.Function.as_null.one;
        var data=p.data||{};
        var trans=p.trans||function(xp){
            xp.value(xp.notice);
        };
        
        var count=0;
        var tcount=0;
        for(var k in data){
            count++;
        }
        
        var ret={};
        if(count==0){
            //空
            success(ret);
        }else{
            //有
            var notice=function(){
                tcount++;
                if(tcount==count){
                    success(ret);
                }
            };
            mb.Object.forEach(data, function(v,k){
                trans({
                    value:v,
                    key:k,
                    notice:function(back){
                        ret[k]=back;
                        notice();
                    }
                });
            });
        }
    },
    /***
     * 有顺序执行完
     * @param array
     * @param trans{
     * row
     * index
     * notice
     * }
     * @param success
     */
    queue:function(p){
        var array=p.array||[];
        var success=p.success||mb.Function.as_null.one;
        var trans=p.trans||function(xp){
            xp.row(xp.notice);
        };
        var ret=[];
        var cache=[];
        mb.Array.forEach(array, function(row){
            cache.push(row);
        });
        var idx=0;
        var load=function(){
            //这种方法总是可行的
            if(cache.length!=0){
                trans({
                    row:cache.shift(),
                    index:idx,
                    notice:function(val){
                        ret.push(val);
                        idx++;
                        load();
                    }
                });
            }else{
                //mb.log(array.length,idx,"成功");//竟然有1、0成功的
                success(ret);
            }
            //为什么总是不行！
            /*
            if(idx<array.length){
                var row=array[idx];
                row(function(val){
                   ret.push(val);
                   load();
                });
                idx=idx+1;
                mb.log("增加了",idx,row,"xx")
            }else{
                success(ret);
            }
            */
        };
        load();
    }
};
mb.ajax=(function(){
    var getXHR=(function(){
        if(window.XMLHttpRequest){
            return function(){
                return new XMLHttpRequest();
            };
        }else{
            return function(){
                return new ActiveXObject('Microsoft.XMLHTTP');
            };
        }
    })();

    /*
    type 选填，默认GET
    operate(xhr)
    data 选填
    success 必填

    */
    var baseAjax=function(p,type){
        var xhr=getXHR();
        xhr.onreadystatechange=function(){
            if (xhr.readyState==4 && xhr.status==200)
            {
                p.success(xhr);
            }
        };
        xhr.open(type,encodeURI(p.url),true);
        if(p.operate){
            p.operate(xhr);
        }
        return xhr;
    };
    var normalGET=function(p) {
        var xhr=baseAjax(p,"GET");
        xhr.send();//不能sendData
    };

    var common_getData=function(xhr,p){      
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8;");//一定要charset否则乱码
        return mb.util.urlFromDic(p.data);
    };
    var getData=common_getData;
    if(window.FormData){
        getData=function(xhr,p){
            if(p.data instanceof window.FormData){
                return p.data;
            }else{
                return common_getData(xhr,p);
            }
        };
    }
    var normalPOST=function(p) {
        var xhr=baseAjax(p,"POST");
        var data;
        if(p.data){
            data=getData(xhr,p);
        }
        xhr.send(data);
    };
    var me={
        text:function(p) {
            var success=p.success||mb.Function.as_null.one;
            p.success=function(xhr) {
                success(xhr.responseText);
            }
            normalGET(p);
        },
        get:normalGET,
        post:normalPOST,
        util:{
            cros:function(xhr) {
                xhr.withCredentials=true;
            },
            parseJSON:function(txt){
                /**
                 * 如今全局条件引入json，则无此问题
                 * 可能被脚本注入攻击，但如果后端用框架生成的JSON而非字符串拼凑，则没问题。
                 */
                /*
                var a=null;
                eval('a='+txt);
                return a;
                */
                return JSON.parse(txt);
            }
        },
        /**
         * @baseUrl 是否重写默认的baseUrl
         * @data{key,url},
         * @success dic/function
         */
        require:(function(){
            /**
             * 
             * @param {*路径} url 
             * @param {*模块加载完成，如何处理} notice(success)=>function(){}
             * @param {*}baseUrl
             */
            var require=function(xp){
                var value=require_getUrl(xp.url);
                if(value){
                    xp.notice(value);
                }else{
                    require.getTxt(xp.url,function(txt){
                        var lib={};
                        /**
                         * 从once中获得数据
                         */
                        var cp=mb.ajax.require.cp;//全局共享
                        try{
                            txt="//"+xp.url+"\r\n"+txt;
                            var body=eval(txt);
                        }catch(ex){
                            mb.ajax.require.dealEX(xp.url,"Eval时",ex);
                        }
                        /*计算success*/
                        var success;
                        if(typeof(body.success)=='function'){
                            success=function(){
                                try{
                                    return body.success.apply(body.success,arguments);
                                }catch(ex){
                                    mb.ajax.require.dealEX(xp.url,"运行时",ex);
                                }
                            };
                            if(body.delay){
                                /*尚未加载模块*/
                                success=success();
                            }
                        }else{
                            /*非函数*/
                            success=body.success;
                        }
                        require_saveUrl(xp.url,success);
                        var x_notice=function() {
                            xp.notice(success);
                        };
                        /*结束*/
                        //不再使用once，而是通过data中使用的all将异步库转成标准的require库
                        /*计算相对路径*/
                        var pathOf=function(url){
                            if(url){
                                return require.calUrl(xp.baseUrl,xp.url,url);
                            }else{
                                return xp.url;
                            }
                        };
                        /*模块加载*/
                        if(body.data){
                            xp.baseUrl=xp.baseUrl||mb.ajax.require.baseUrl
                            var arr=[];
                            /*加载单个模块，加载后通知*/
                            var getJS=function(url,notice) {
                                require({
                                    baseUrl:xp.baseUrl,
                                    url:pathOf(url),
                                    notice:notice
                                });
                            };
                            mb.Object.forEach(body.data, function(v,k){
                                var tp=typeof(v);
                                arr.push(function(next){
                                    var load_success=function(success){
                                        lib[k]=success;
                                        next();
                                    };
                                    if(tp=='string'){
                                        /*基础的模块加载*/
                                        getJS(v,load_success);
                                    }else
                                    if(tp=='function'){
                                        /*依赖倒置型加载*/
                                        v(load_success);
                                    }
                                });
                            });
                            mb.task.queue({
                                array:arr,
                                success:x_notice
                            });
                        }else{
                            x_notice();
                        }
                    });
                }
            };
            
            (function(){
                //缓存文件
                var willDef=false;
                if(window.top!=window){
                    try{
                        if(window.top.mb){
                            require._getTxt=window.top.mb.ajax.require._getTxt;
                            require._saveTxt=window.top.mb.ajax.require._saveTxt;
                        }else{
                            willDef=true;
                        }
                    }catch(e){
                        willDef=true;
                    }
                }else{
                    willDef=true;
                }
                if(willDef){
                    var _required_txt={};
                    require._required_txt=_required_txt;
                    require._saveTxt=function(k,v){
                        _required_txt[k]=v;
                    };
                    require._getTxt=function(k){
                        return _required_txt[k];
                    };
                }
            })();
            /*从远端请求文件，如果是嵌入webView，可能重写*/
            var ajaxText=(function(){
                var _id=(new Date()).getTime();
                var _i=0;
                return function(url,success){
                    _i++;
                    mb.ajax.text({
                        url:url+"?_id="+_id+_i,
                        success:success
                    });
                };
            })();
            /**
             * 本地缓存，所有地方可用
             */
            require.getTxt=function(url,suc){
                var v=require._getTxt[url];
                if(v && v.v==require._v_){ //存在而且版本号相同
                    suc(v.txt);
                }else{
                    ajaxText(url,function(txt){
                        require._saveTxt(url,{
                            txt:txt,
                            v:require._v_
                        });
                        suc(txt);
                    });
                }
            };
            //不同iframe缓存js函数
            var _required={};
            require._required=_required;
            var require_saveUrl=function(k,v){
                _required[k]=v;
            };
            var require_getUrl=function(k){
                return _required[k];
            };
            require.calUrl=function(base_url,current_url,url){
                if(url[0]=='.'){
                    url=mb.util.calAbsolutePath(current_url,url);
                }else{
                    url=base_url+url;
                }
                return url;
            }
            /*错误处理*/
            require.dealEX=function(url,step,ex) {
                mb.log(url);
                mb.log(step);
                mb.log(JSON.stringify(ex));
                throw ex;
            };
            return require;
        })()
    };
    return me;
})();
mb.util={
    dicFromUrl:function(uri){
       var url = decodeURI(uri); //获取url中"?"符后的字串
       var theRequest = new Object();
       if (url.indexOf("?") != -1) {
          var str = url.substr(1);
          var strs = str.split("&");
          for(var i = 0; i < strs.length; i ++) {
             theRequest[strs[i].split("=")[0]]=unescape(strs[i].split("=")[1]);
          }
       }
       return theRequest; 
    },    
    /***
     * 字典转请求参数
     * @param dic
     * @param prefix 如"xmlRequest."
     * @returns {String} 只是a=x&b=x...这样的部分请求语句
     */
    urlFromDic:function(dic,prefix){
        var xk=[];
        if(prefix==null)
        {
            for(var k in dic)
            {
                xk.push(encodeURI(k)+"="+encodeURI(dic[k]));
            }
        }else
        {
            for(var k in dic){
                xk.push(encodeURI(prefix+k)+"="+encodeURI(dic[k]));
            }
        }
        return xk.join("&");
    },
    /**
     * 计算绝对路径
     */
    calAbsolutePath:function(base_url,url){
        if(url[0]=="."){
            var base=base_url.substr(0,base_url.lastIndexOf('/'))+'/'+url;
            var nodes=base.split('/');
            var rets=[];
            var last=null;
            for(var i=0;i<nodes.length;i++){
                var node=nodes[i];
                if(node=='..'){
                    if(last=='..'){
                        rets.push(node);
                    }else
                    if(last==null){
                        rets.push(node);
                        last=node;
                    }else{
                        rets.pop();
                        last=rets[rets.length-1];
                    }
                }else
                if(node=='.'){
                    //忽略
                }else{
                    rets.push(node);
                    last=node;
                }
            }
            return rets.join('/');
        }else{
            return url;
        }
    }
};
mb.browser=(function(){
    //http://www.jb51.net/article/50464.htm
    var myBrowser=function(){
        var ret={};
        
        var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
        var isOpera = userAgent.indexOf("Opera") > -1; //判断是否Opera浏览器
        var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera; //判断是否IE浏览器
        var isFF = userAgent.indexOf("Firefox") > -1; //判断是否Firefox浏览器
        var isSafari = userAgent.indexOf("Safari") > -1; //判断是否Safari浏览器
        if (isIE) {
            mb.isIE=true;
            var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
            reIE.test(userAgent);
            ret.type="IE";
            ret.version=parseFloat(RegExp["$1"]);
            ret.documentMode=document.documentMode;//IE的文档模式
        }
        if (isFF) {
            ret.type="FF";
        }
        if (isOpera) {
            ret.type=="Opera";
        }
        if (isSafari){
            ret.type=="Safari";
        }
        return ret;
    };
    var ret=myBrowser();
    mb.log(ret,navigator.userAgent);
    return ret;
})();
mb.DOM=(function(){
    var isTouch= ("ontouchend" in document)? true : false;
    return {
        cls:function(el){
            var clss=[];
            var update=function(){
                el.setAttribute("class",clss.join(" "));
            };
            var indexOf=function(cls){
                return mb.Array.indexOf(clss,cls);
            };
            return {
                add:function(cls){
                    if(indexOf(cls)==-1){
                        clss.push(cls);
                        update();
                    }
                },
                remove:function(cls){
                    var index=indexOf(cls);
                    if(index!=-1){
                        clss.splice(index,1);
                        update();
                    }
                }
            };
        },
        empty:function(el){
            while(el.firstChild){
                el.removeChild(el.firstChild);
            };
        },
        addEvent:(function(){
            var transDic={};
            if(isTouch){
                transDic={
                    //click:"touchstart",
                    mousedown:"touchstart",
                    mousemove:"touchmove",
                    mouseup:"touchend"
                };
            }
            if(window.addEventListener){
                return function(e,t,f){
                    t=transDic[t]||t;
                    e.addEventListener(t,f);
                };
            }else
            if(window.attachEvent){
                return function(e,t,f){
                    e.attachEvent("on"+t,f);
                };
            }else{
                alert("不支持");
            }
        })(),
        removeEvent:(function(){
            var transDic={};
            if(isTouch){
                transDic={
                    //click:"touchstart",
                    mousedown:"touchstart",
                    mousemove:"touchmove",
                    mouseup:"touchend"
                };
            }
            if(window.removeEventListener){
                return function(e,t,f){
                    t=transDic[t]||t;
                    e.removeEventListener(t,f);
                };
            }else
            if(window.detachEvent){
                return function(e,t,f){
                    e.detachEvent("on"+t,f);
                };
            }else{
                alert("不支持");
            }
        })(),
        preventDefault:function(e){
            if(!e){
                e=window.event;
            }
            if(e.preventDefault){
                e.preventDefault();
            }else{
                e.returnValue=false;
            }
        },
        stopPropagation:function(e){
           if(e.stopPropagation){
               e.stopPropagation();
           }else{
               e.cancelBubble=true;
           }
        },
        eventPoint:(function(){
            if(isTouch){
                return function(e){
                    return {
                        x:e.targetTouches[0].pageX,
                        y:e.targetTouches[0].pageY
                    };
                };
            }else{
                return function(e){
                    return {
                        x:e.clientX,
                        y:e.clientY
                    };
                };
            }
        })(),
        //滚动条宽度
        scrollWidth:(function(){
            var cache;
            return function(){
                if(!cache){
                    var el=jsdom.parseElement({
                        type:"div",
                        style:{
                            width:mb.isIE?"5px":"",
                            overflow:"scroll"
                        }
                    });
                    document.body.appendChild(el);
                    cache=el.offsetWidth-el.clientWidth;//ie下clientWidth始终是0，但width设置小一点，能看到原本的17
                    document.body.removeChild(el);
                }
                return cache;
            };
        })(),
        //div允许tab,需要contenteditable
        divTabAllow:function(e){
            if (e.keyCode === 9) { // tab key
                e.preventDefault();  // this will prevent us from tabbing out of the editor
                
                // now insert four non-breaking spaces for the tab key
                var editor = e.target;
                var doc = editor.ownerDocument.defaultView;
                var sel = doc.getSelection();
                var range = sel.getRangeAt(0);
                
                var tabNode = document.createTextNode("\u00a0\u00a0\u00a0\u00a0");
                range.insertNode(tabNode);
                
                range.setStartAfter(tabNode);
                range.setEndAfter(tabNode);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        },
        //inpu允许tab
        inputTabAllow:function(e){
            if (e.keyCode === 9){
                mb.DOM.preventDefault(e);
                //参考https://segmentfault.com/q/1010000000694609
                var el=e.target;
                var start = el.selectionStart,
                    end = el.selectionEnd, 
                    value = el.value;
                var lineStart = value.lastIndexOf('\n', start),
                    lineEnd = value.indexOf('\n', end),
                    offset = 0;

                if (lineStart === -1) lineStart = 0;
                if (lineEnd === -1) lineEnd = value.length;

                if (lineStart === lineEnd);
                else if (lineStart !== 0) lineStart += 1;

                var lines = value.substring(lineStart, lineEnd).split('\n');
                if (lines.length > 1) {
                    offset = lines.length;
                    lines = '\t' + lines.join('\n\t');

                    el.value = value.substring(0, lineStart) + lines + value.substring(lineEnd);

                    el.selectionStart = start + 1;
                    el.selectionEnd = end + offset;
                } else {
                    offset = 1;
                    lines = lines[0];

                    el.value = value.substring(0, start) + '\t' + value.substring(end);

                    el.selectionStart = el.selectionEnd = start + offset;
                }
            }
        },
        //是否是手机
        isMobile:(function(){
            var _is_=window.screen.availWidth<800;
            return function(){
                return _is_;
            }
        })()
    };
})();
mb.Array={
    isArray:function(array){
        return Object.prototype.toString.call(array) === '[object Array]';
    },
    ieEmpty:(function(){
        if(mb.isIE){
            return function(ary){
                var ret=[];
                mb.Array.forEach(ary, function(ar){
                    if(ar!==undefined){
                        //去除其中的undefined
                        ret.push(ar);
                    }
                });
                ary.length=0;
                mb.Array.forEach(ret,function(ar){
                    ary.push(ar);
                });
                return ary;
            };
        }else{
            return mb.Function.as_null.one;
        }
    })(),
    forEach:function(array,func){
        for(var i=0;i<array.length;i++){
            func(array[i],i);
        }
    },
    map:function(array,func){
        var ret=[];
        for(var i=0;i<array.length;i++){
            ret[i]=func(array[i],i);
        }
        return ret;
    },
    reduce:function(array,func,init){
        for(var i=0;i<array.length;i++){
            init=func(init,array[i],i,array);
        }
        return init;
    },
    filter:function(array,func){
        var ret=[];
        for(var i=0;i<array.length;i++){
            var row=array[i];
            if(func(row,i)){
                ret.push(row);
            }
        }
        return ret;
    },
    find_index:function(array,fun){
        var ret=-1;
        for(var i=0;i<array.length && ret==-1;i++){
            if(fun(array[i])){
                ret=i;
            }
        }
        return ret;
    },
    indexOf:function(array,row){
        return mb.Array.find_index(array,function(c){
            return row==c;
        });
    },
    find_row:function(array,fun){
        return array[mb.Array.find_index(array,fun)];
    },
    find_indexes:function(array,fun){
        var ret=[];
        for(var i=0;i<array.length;i++){
            if(fun(array[i])){
                ret.push(i);
            }
        }
        return ret;
    },
    indexesOf:function(array,row){
        return mb.Array.find_indexes(array,function(c){
            return row==c;
        });
    },
    find_rows:function(array,fun){
        var ret=[];
        var indexes=mb.Array.find_indexes(array,fun);
        for(var i=0;i<indexes.length;i++){
            ret.push(array[indexes[i]]);
        }
        return ret;
    },
    remove:function(array,row){
        var index=mb.Array.indexOf(array,row);
        array.splice(index,1);
    }
},
mb.Object={
    forEach:function(object,func){
        for(var key in object){
            func(object[key],key);
        }
    },
    map:function(object,func){
        var ret={};
        for(var key in object){
            ret[key]=func(object[key],key);
        }
        return ret;
    },
    reduce:function(obj,func,init){
        for(var k in obj){
            init=func(init,obj[k],k);
        }
        return init;
    },
    toArray:function(obj,func){
        var r=[];
        for(var k in obj){
            r.push(func(obj[k],k,obj));
        }
        return r;
    },
    ember:function(me,obj){
        for(var key in obj){
            me[key]=obj[key];
        }
    },
    combine:function(a,b) {
        var ret={};
        for(var key in a){
            ret[key]=a[key];
        }
        for(var key in b){
            ret[key]=b[key];
        }
        return ret;
    }
};
if(!String.prototype.startsWith){
    String.prototype.startsWith=function(str) {
        return (this.indexOf(str)==0);
    };
}
if(!String.prototype.endsWith){
    String.prototype.endsWith=function(str) {
        return (this.lastIndexOf(str)==this.length-str.length);
    };
}

if(window.load_success){
    window.load_success("front-lib/lib.js");
}