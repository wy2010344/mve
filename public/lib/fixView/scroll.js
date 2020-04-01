define(["require", "exports", "./util", "../mve/index", "../mve-DOM/index"], function (require, exports, util_1, index_1, index_2) {
    "use strict";
    exports.__esModule = true;
    exports.scrollBuilder = function (getAllBuilder, allParse) {
        return index_1.parseOf(function (me, child) {
            var element = document.createElement("div");
            util_1.buildAbs(me, element, child);
            element.style.overflow = "auto";
            var innerS = document.createElement("div");
            element.appendChild(innerS);
            index_1.parseUtil.bind(me, child.sw, function (v) {
                innerS.style.width = v + "px";
            });
            index_1.parseUtil.bind(me, child.sh, function (v) {
                innerS.style.height = v + "px";
            });
            if (child.background) {
                index_1.parseUtil.bind(me, child.background, function (v) {
                    innerS.style.background = v;
                });
            }
            var childResult = child.children ? allParse.children(me, new index_2.DOMVirtualParam(innerS), child.children) : null;
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
