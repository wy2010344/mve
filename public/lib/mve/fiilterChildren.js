define(["require", "exports", "./ifChildren"], function (require, exports, ifChildren_1) {
    "use strict";
    exports.__esModule = true;
    exports.filterChildren = void 0;
    /**
     * 从一个列表转化到另一个列表，无缓存折
     * @param array
     * @param fun
     */
    function filterChildren(array, fun) {
        return ifChildren_1.ifChildren(function (me) {
            var vs = [];
            mb.Array.forEach(array(), function (row, index) {
                var v = fun(me, row, index);
                if (mb.Array.isArray(v)) {
                    v.forEach(function (vi) { return vs.push(vi); });
                }
                else {
                    vs.push(v);
                }
            });
            return vs;
        });
    }
    exports.filterChildren = filterChildren;
});
