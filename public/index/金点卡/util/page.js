define(["require", "exports", "../../../lib/mve/index", "../../../lib/mve-DOM/index"], function (require, exports, index_1, index_2) {
    "use strict";
    exports.__esModule = true;
    function pageOf(fun) {
        return index_2.parseHTML.mve(function (me) {
            var ur = fun(me);
            index_1.parseUtil.bind(me, ur.title, function (v) {
                document.title = v;
            });
            return ur;
        });
    }
    exports.pageOf = pageOf;
});
