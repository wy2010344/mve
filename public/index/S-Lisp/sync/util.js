({
    data:{
        util:"../util.js"
    },
    delay:true,
	success:function() {
        var kvs_extend=lib.util.kvs_extend;
		var Fun=new Function();
		Fun.prototype.isFun=true;

        function LibFun(fun) {
            this.fun=fun;
            this.exec=function(node) {
                try{
                    return this.fun(node);
                }catch(e){
                    mb.log(node.toString());
                    return null;
                }
            };
        }
        LibFun.prototype=new Fun();
        mb.Object.ember(LibFun.prototype,{
            toString:function() {
                return this.fun.toString();
            }
        });
        return {
            Fun:Fun,
            LibFun:LibFun
        };
	}
})