define(["require", "exports"], function (require, exports) {
    "use strict";
    return function (util, Parse) {
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
                var element_result = Parse(mvvm, gm.life, e, user_result, {
                    k: gm.me.k,
                    inits: [],
                    destroys: []
                });
                return {
                    element: element_result.element,
                    out: user_result.out,
                    init: function () {
                        gm.forEachRun(element_result.m.inits);
                    },
                    destroy: function () {
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
        };
        mvvm.Watch = util.Watcher;
        mvvm.lifeModel = function () {
            var watchpool = [];
            return {
                me: {
                    Watch: function (w) {
                        watchpool.push(util.Watcher(w));
                    }
                },
                destroy: function () {
                    watchpool.forEach(function (w) {
                        w.disable();
                    });
                    watchpool.length = 0;
                }
            };
        };
        return mvvm;
    };
});
