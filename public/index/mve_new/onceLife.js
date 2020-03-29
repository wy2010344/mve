define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    function onceLife(p) {
        var self = {
            isInit: false,
            isDestroy: false,
            init: function () {
                if (self.isInit) {
                    mb.log("禁止重复init");
                }
                else {
                    self.isInit = true;
                    p.init();
                }
            },
            destroy: function () {
                if (self.isDestroy) {
                    mb.log("禁止重复destroy");
                }
                else {
                    self.isDestroy = true;
                    if (self.isInit) {
                        p.destroy();
                    }
                    else {
                        mb.log("未初始化故不销毁");
                    }
                }
            }
        };
        return self;
    }
    exports.onceLife = onceLife;
});
