({
    data:{
        util:"./util.js",
        DOM:"./DOM.js",
        buildChildren:"./parse/buildChildren.js",
        nokey:"./parse/nokey.js",
        parse:"./parse/index.js"
    },
    success:function(){
        /**
         * repeat生成json结果是被观察的，受哪些影响，重新生成，替换原来的节点。
         * 生成过程，而json叶子结点里的函数引用，如style,attr，则受具体的影响
         */
        return lib.util.Exp(
            lib.parse(
                lib.DOM,//DOM的操作手法
                lib.buildChildren(
                    lib.util.Value,
                    lib.util.Watcher,
                    lib.DOM,//DOM的操作手法
                    lib.nokey
                ),
                lib.util.locsize
            )
        );
    }
});