define(["require", "exports", "../../mve/index", "./util"], function (require, exports, index_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.ulBuilder = void 0;
    var ulBuilder = function (getAllBuilder, allParse) {
        var liParse = index_1.parseOf(function (me, child) {
            var element = document.createElement("li");
            var childrenResult = child.children ? allParse.children(me, new util_1.DOMVirtualParam(element), child.children) : null;
            return {
                element: element,
                init: function () {
                },
                destroy: function () {
                }
            };
        });
        return index_1.parseOf(function (me, child) {
            var element = document.createElement("ul");
            var childrenResult = child.children ? liParse.children(me, new util_1.DOMVirtualParam(element), child.children) : null;
            return {
                element: element,
                init: function () {
                    if (childrenResult) {
                        childrenResult.init();
                    }
                },
                destroy: function () {
                    if (childrenResult) {
                        childrenResult.destroy();
                    }
                }
            };
        });
    };
    exports.ulBuilder = ulBuilder;
});
