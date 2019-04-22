({
	data:{
		util:"./util.js"
	},
	success:function(Parse){
        var forEach_run=function(array){
            mb.Array.forEach(array,function(r){r();});
        };
        var mvvm=function(user_func){
            /**
            pel
            replaceChild(pel,old,new){
                old是第一次
            }
            */
            return function(e){
                 var watchPool=[];
                 var Watch=function(p){
                     var w=lib.util.Watcher(p);
                     watchPool.push(w);
                     return w;
                 };
                 var Cache=function(exp){
                     return lib.util.Cache(Watch,exp);
                 };
                 /**
                 element
                 init
                 destroy

                 out:附加到生成的实体上

                 lib.util.util.locsize:[]
                 */
                 var user_params={
                    Value:lib.util.Value,
                    ArrayModel:lib.util.ArrayModel,
                    Watch:Watch,
                    Cache:Cache
                 };
                 var user_result=user_func(user_params);
                 //这个函数应该返回布局，而不再显式提供Parse
                 var me={};
                 //如果也在out中定义，会被out中相关覆盖
                 if(user_result.out){
                    mb.Object.forEach(user_result.out,function(v,k){
                        me[k]=v;
                    });
                 }
                 var element_result=Parse(
                    e,
                    user_result.element,
                    Watch,
                    mvvm,
                    {}
                 );
                 user_params.k=element_result.k;
                 var user_init=user_result.init||mb.Function.quote.one;
                 var user_destroy=user_result.destroy||mb.Function.quote.one;

                 me.element=element_result.element;
                 me.init=function() {
                    forEach_run(element_result.inits);
                    user_init();
                 };
                 me.destroy=function() {
                    user_destroy();
                    forEach_run(element_result.destroys);
                    var w;
                    while((w=watchPool.shift())!=null){
                        w.disable();
                    }
                 };
                 return me;
             };
         };
         mvvm.NS={
            svg:"http://www.w3.org/2000/svg"
         };
         return mvvm;
	}
})