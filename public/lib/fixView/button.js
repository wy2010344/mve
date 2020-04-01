define(["require", "exports", "./util", "../mve/index"], function (require, exports, util_1, index_1) {
    "use strict";
    exports.__esModule = true;
    exports.buttonBuilder = function (getAllBuilder, allParse) {
        return index_1.parseOf(function (me, child) {
            var element = document.createElement("div");
            util_1.buildAbs(me, element, child);
            index_1.parseUtil.bind(me, child.text, function (v) {
                element.innerText = v;
            });
            if (child.color) {
                index_1.parseUtil.bind(me, child.color, function (v) {
                    element.style.color = v;
                });
            }
            if (child.background) {
                index_1.parseUtil.bind(me, child.background, function (v) {
                    element.style.background = v;
                });
            }
            element.style.cursor = "pointer";
            mb.DOM.addEvent(element, "click", child.click);
            return {
                element: element,
                init: function () { },
                destroy: function () { }
            };
        });
    };
});
