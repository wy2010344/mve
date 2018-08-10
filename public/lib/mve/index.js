({
    data:{
        util:"mve/util.js",
        Parse:"mve/Parse.js"
    },
    delay:true,
    success:function(){
        /**
         * repeat生成json结果是被观察的，受哪些影响，重新生成，替换原来的节点。
         * 生成过程，而json叶子结点里的函数引用，如style,attr，则受具体的影响
         */
        return lib.util.Exp(lib.Parse);
    }
});