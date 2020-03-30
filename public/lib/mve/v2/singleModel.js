define(["require", "exports", "./onceLife"], function (require, exports, onceLife_1) {
    "use strict";
    exports.__esModule = true;
    function isSingleTargetFun(target) {
        return typeof (target) == 'function';
    }
    /**单节点或有限节点*/
    function singleBuilder(parseView) {
        var mx = {
            buildSingle: function (me, target, p) {
                if (isSingleTargetFun(target)) {
                    return target(mx, p);
                }
                else {
                    var init_1, destroy_1;
                    var element = void 0;
                    if ('element' in target) {
                        init_1 = target.init;
                        destroy_1 = target.destroy;
                        element = target.element;
                    }
                    else {
                        element = target;
                    }
                    var view_1 = parseView(me, element);
                    p.set(view_1.element);
                    var life = onceLife_1.onceLife({
                        init: function () {
                            view_1.init();
                            if (init_1) {
                                init_1();
                            }
                        },
                        destroy: function () {
                            if (destroy_1) {
                                destroy_1();
                            }
                            view_1.destroy();
                        }
                    });
                    return life;
                }
            }
        };
        return function (p, me, target) {
            return mx.buildSingle(me, target, p);
        };
    }
    exports.singleBuilder = singleBuilder;
});
