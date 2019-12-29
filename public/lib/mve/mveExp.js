define(["require", "exports"], function (require, exports) {
    "use strict";
    return function (util, compatible, Parse) {
        function mvvm(user_func) {
            /**
            pel
            replaceChild(pel,old,new){
                old是第一次
            }
            */
            return function (e) {
                var gm = util.generateMe();
                var user_result = user_func(gm.me);
                //这个函数应该返回布局，而不再显式提供Parse
                if (user_result.element && typeof (user_result.element) == "object") {
                    var user_result_element = user_result.element;
                }
                else {
                    var user_result_element = compatible(user_func, user_result);
                }
                var element_result = Parse(mvvm, gm.life, e, user_result_element, {
                    k: gm.me.k,
                    inits: [],
                    destroys: []
                });
                var user_init = user_result.init || mb.Function.quote.one;
                var user_destroy = user_result.destroy || mb.Function.quote.one;
                return {
                    element: element_result.element,
                    out: user_result.out,
                    init: function () {
                        gm.forEachRun(element_result.m.inits);
                        user_init();
                    },
                    destroy: function () {
                        user_destroy();
                        gm.forEachRun(element_result.m.destroys);
                        gm.destroy();
                    }
                };
            };
        }
        ;
        mvvm.Value = util.Value;
        mvvm.ArrayModel = util.ArrayModel;
        mvvm.render = function (fun) {
            return {
                render: fun
            };
        },
            mvvm.renders = function (fun) {
                return {
                    multi: true,
                    render: fun
                };
            },
            mvvm.repeat = util.repeat;
        mvvm.children = function (av) {
            return [av];
        };
        return mvvm;
    };
});
