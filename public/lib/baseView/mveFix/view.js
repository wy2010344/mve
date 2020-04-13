define(["require", "exports", "./util", "../index", "../mve/index"], function (require, exports, util_1, index_1, index_2) {
    "use strict";
    exports.__esModule = true;
    exports.viewBuilder = function (getAllBuilder, allParse) {
        return index_2.parseOf(function (me, child) {
            var element = new index_1.BView();
            util_1.buildAbs(me, element, child);
            var childResult = child.children ? allParse.children(me, new util_1.BViewVirtualParam(element), child.children) : null;
            return {
                element: element,
                destroy: function () {
                    if (childResult) {
                        childResult.destroy();
                    }
                }
            };
        });
    };
});
