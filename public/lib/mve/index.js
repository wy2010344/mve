({
    delay:true,
    success:function(){
        var mve={
             Dep:(function(){
                 var uid=0;
                 var Dep=function(){
                     var subs={};
                     var me={
                         id:uid++,
                         _subs_:subs,//测试可以看到
                         depend:function(){
                             if(Dep.target){
                                 subs[Dep.target.id]=Dep.target;
                             }
                         },
                         notify:function(){
                             var oldSubs=subs;
                             subs={};//清空
                             me._subs_=subs;
                             mb.Object.forEach(oldSubs,function(sub){
                                 sub.update();
                             });
                         }
                     };
                     return me;
                 };
                 Dep.target=null;
                 return Dep;
             })(),
             Value:function(v){       
                 var dep=mve.Dep();
                 var ret=function(){
                     if(arguments.length==0){
                         //getter
                         dep.depend();
                         return v;
                     }else{
                         if(mve.Dep.target){
                             throw "计算期间不允许修改";
                         }else{
                             v=arguments[0];
                             dep.notify();
                         }
                     }
                 };
                 ret._dep_=dep;
                 return ret;
             },
             Watcher:(function(){      
                 var uid=0;
                 window._watcher={};//监视Watcher是否销毁。
                 return function(p){
                     p.before=p.before||mb.Function.quote.one;
                     p.after=p.after||mb.Function.quote.one;
                     
                     var enable=true;
                     var me={
                         id:uid++,
                         _p_:p,
                         update:function(){
                             if(enable){
                                 var before=p.before();
                                 /**
                                  * 每一次exp计算时，将计算中引用到的Value/Cache等的subs包含自己。
                                  * 每次改变通知时，subs的每个watch
                                  * 
                                  * 条件依赖b，不依赖时，b的任何变化影响不到，依赖时，b的任何变化都能影响。
                                  * a->true,引用b,a->false，不引用b,但是b的subs都含有me，只有下一次b改变时才计算更新。也就是b的计算不影响，仍通知了，通知了更新了引用。
                                  * 
                                  * 静态的，所有watch实例与dep(Value/Cache)一起销毁。
                                  * 通常作为源的dep(Value/Cache)生存期更长，某些动态生成的watch组件，如Array的repeat和navigation，没办法销毁subs中的引用，每次仍会计算，则会累积膨胀，内存泄露。
                                  * 有一个办法，就是销毁时，watch中的exp自动置为空，则下一次更新时不依赖到。
                                  * Array的repeat每个都会平等地依赖到，影响倒是不大
                                  * navigation的更新只能是事件更新，不能传递value。
                                  */
                                 mve.Dep.target=me;
                                 var after=p.exp(before);
                                 mve.Dep.target=null;
                                 
                                 p.after(after);
                             }
                         },
                         disable:function(){
                             enable=false;
                             delete window._watcher[me.id];
                         }
                     };
                     window._watcher[me.id]=p.exp;
                     me.update();
                     return me;
                 };
             })(),
             Cache:function(watch,func){
                 var dep=mve.Dep();
                 var cache;
                 watch({
                     exp:function(){
                        cache=func();
                        dep.notify();
                     }
                 });
                 return function(){
                     //只有getter;
                     dep.depend();
                     return cache;
                 };
             },
             locsize:["width","height","left","top","right","bottom"]
        };
        
        return mve;
    }
});