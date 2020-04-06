define(["require", "exports", "./ifChildren"], function (require, exports, ifChildren_1) {
    "use strict";
    exports.__esModule = true;
    function filterChildren(array, fun) {
        return ifChildren_1.ifChildren(function (me) {
            return mb.Array.map(array(), function (row, index) {
                return fun(me, row, index);
            });
        });
    }
    exports.filterChildren = filterChildren;
});
