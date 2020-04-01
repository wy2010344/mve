define(["require", "exports", "../mve/index", "../mve-DOM/index", "./util"], function (require, exports, index_1, index_2, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.viewBuilder = function (getAllBuilder, allParse) {
        return index_1.parseOf(function (me, child) {
            var element = document.createElement("div");
            element.style.userSelect = "none";
            util_1.buildAbs(me, element, child);
            if (child.background) {
                index_1.parseUtil.bind(me, child.background, function (v) {
                    element.style.background = v;
                });
            }
            var childResult = child.children ? allParse.children(me, new index_2.DOMVirtualParam(element), child.children) : null;
            return {
                element: element,
                init: function () {
                    if (childResult) {
                        childResult.init();
                    }
                },
                destroy: function () {
                    if (childResult) {
                        childResult.destroy();
                    }
                }
            };
        });
    };
});
