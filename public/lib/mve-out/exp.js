({
	data:{
		mve:"../mve/index.js"
	},
	success:function(Parse){
         var mvvm=function(user_func){
             var watchPool=[];
             var Watch=function(p){
                 var w=lib.mve.Watcher(p);
                 watchPool.push(w);
                 return w;
             };
             var Cache=function(exp){
                 return lib.mve.Cache(Watch,exp);
             };
             /**
             element
             init
             destroy

             out:附加到生成的实体上

             lib.mve.util.locsize:[]
             */
             var user_params={
                Value:lib.mve.Value,
                Watch:Watch,
                Cache:Cache
             };
             var user_result=user_func(user_params);
             //这个函数应该返回布局，而不再显式提供Parse
             var me={};
             mb.Array.forEach(
                lib.mve.locsize, 
                function(str){
                    var v;
                    if(user_result[str]){
                        v=user_result[str];
                    }else{
                        v=lib.mve.Value(0);
                    }
                    me[str]=v;
                 }
             );
             //如果也在out中定义，会被out中相关覆盖
             if(user_result.out){
                mb.Object.forEach(user_result.out,function(v,k){
                    me[k]=v;
                });
             }
             var element_result=Parse(
                user_result.element,
                Watch,
                mvvm,
                {}
             );
             user_params.k=element_result.k;
             var user_init=user_result.init||mb.Function.quote.one;
             var user_destroy=user_result.destroy||mb.Function.quote.one;
             var element_init=element_result.init||mb.Function.quote.one;
             var element_destroy=element_result.destroy||mb.Function.quote.one;

             me.getElement=element_result.getElement;
             me.init=function() {
                element_init();
                user_init();
             };
             me.destroy=function() {
                user_destroy();
                element_destroy();
                var w;
                while((w=watchPool.shift())!=null){
                    w.disable();
                }
             };
             return me;
         };
         mvvm.NS={
            svg:"http://www.w3.org/2000/svg"
         };
         return mvvm;
	}
})