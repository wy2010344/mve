define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.singleBuilder = void 0;
    function isSingleTargetFun(target) {
        return typeof (target) == 'function';
    }
    /**单节点或有限节点*/
    function singleBuilder(parseView) {
        var buildSingle = function (me, target, set) {
            if (isSingleTargetFun(target)) {
                return target(buildSingle, set);
            }
            else {
                var element = target;
                var view = parseView(me, element);
                set(view.element);
                return view;
            }
        };
        return function (p, me, target) {
            return buildSingle(me, target, p);
        };
    }
    exports.singleBuilder = singleBuilder;
});
