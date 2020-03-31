define(["require", "exports", "../lib/mve/ifChildren"], function (require, exports, ifChildren_1) {
    "use strict";
    exports.__esModule = true;
    function div(p) {
        return ifChildren_1.ifChildren(function (me) {
            return {
                init: function () {
                    mb.log("我是可选的init函数，在附着到DOM上后执行");
                },
                elements: [
                    {
                        type: "div",
                        text: function () {
                            return p.text();
                        }
                    }
                ]
            };
        });
    }
    exports.div = div;
});
