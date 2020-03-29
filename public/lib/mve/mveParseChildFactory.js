define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    function dealChildResult(user_result) {
        if (mb.Array.isArray(user_result)) {
            var user_init = mb.Function.quote.one;
            var user_destroy = mb.Function.quote.one;
            var elements = user_result;
        }
        else {
            var user_init = user_result.init || mb.Function.quote.one;
            var user_destroy = user_result.destroy || mb.Function.quote.one;
            if ('element' in user_result) {
                //mb.log("children不推荐单元素")
                if (mb.Array.isArray(user_result.element)) {
                    var elements = user_result.element;
                }
                else {
                    var elements = [user_result.element];
                }
            }
            else {
                //没有生命周期的平结点
                var elements = [user_result];
            }
        }
        return {
            init: user_init,
            destroy: user_destroy,
            elements: elements
        };
    }
    exports.dealChildResult = dealChildResult;
    /**
     * 初始化时自动附加到dom
     * 销毁时自动销毁
     * 返回元素列表，手动组合
     */
    function mveParseChildFactory(p) {
        return function (fun) {
            return function (e, realBuildChildren, keep) {
                var gm = p.generateMe();
                var user_result = dealChildResult(fun(gm.me));
                var element_result = realBuildChildren(e, gm.life, user_result.elements, {
                    k: {},
                    inits: [],
                    destroys: []
                }, keep.appendChild);
                return {
                    firstElement: element_result.firstElement,
                    views: element_result.views,
                    init: function () {
                        gm.forEachRun(element_result.m.inits);
                        user_result.init();
                    },
                    destroy: function () {
                        gm.forEachRun(element_result.m.destroys);
                        user_result.destroy();
                        gm.destroy();
                    }
                };
            };
        };
    }
    exports.mveParseChildFactory = mveParseChildFactory;
});
