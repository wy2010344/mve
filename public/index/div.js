define(["require", "exports", "../lib/mve/ifChildren"], function (require, exports, ifChildren_1) {
    "use strict";
    exports.__esModule = true;
    exports.div = void 0;
    function div(p) {
        var Test = /** @class */ (function () {
            function Test() {
            }
            Test.prototype.toString = function () {
                return "eafewf";
            };
            return Test;
        }());
        new Test().toString();
        /**
         * 化简分数
         * @param a
         * @param b
         */
        function simpleFraction(a, b) {
            var min = a < b ? a : b;
            var i = 2;
            while (i <= min) {
                if (a % i == 0 && b % i == 0) {
                    a = a / i;
                    b = b / i;
                    i = 2;
                }
                else {
                    i++;
                }
            }
            return [a, b];
        }
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
