define(["require", "exports"], function (require, exports) {
    "use strict";
    return function (p) {
        return function (fun) {
            return function (e, realBuildChildren, keep) {
                var gm = p.generateMe();
                var user_result = fun(gm.me);
                var user_init = user_result.init || mb.Function.quote.one;
                var user_destroy = user_result.destroy || mb.Function.quote.one;
                var element_result = realBuildChildren(e, gm.life, user_result.elements, {
                    k: {},
                    inits: [],
                    destroys: []
                }, function (pel, el) {
                    keep.appendChild(pel, el);
                });
                return {
                    firstElement: element_result.firstElement,
                    firstChild: element_result.firstChild,
                    init: function () {
                        gm.forEachRun(element_result.m.inits);
                        user_init();
                    },
                    destroy: function () {
                        gm.forEachRun(element_result.m.destroys);
                        user_destroy();
                        gm.destroy();
                    }
                };
            };
        };
    };
});
