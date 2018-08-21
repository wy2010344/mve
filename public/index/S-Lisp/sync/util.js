({
    data:{
        util:"../util.js"
    },
    delay:true,
	success:function() {
        var kvs_extend=lib.util.kvs_extend;
		var Fun=new Function();
		Fun.prototype.isFun=true;
        Fun.prototype.Function_type={
            lib:0,
            user:1,
            cache:2
        };

        function LibFun(key,fun) {
            this.fun=fun;
            this.key=key;
        }
        LibFun.prototype=new Fun();
        mb.Object.ember(LibFun.prototype,{
            toString:function() {
                return this.key;
            },
            ftype:function() {
                return this.Function_type.lib;
            },
            exec:function(node) {
                try{
                    return this.fun(node);
                }catch(e){
                    mb.log(e,node.toString(),this.fun.toString());
                    return null;
                }
            }
        });
        return {
            Fun:Fun,
            LibFun:LibFun
        };
	}
})