define(["require", "exports", "../mve/index", "./util"], function (require, exports, index_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.labelBuilder = function (getAllBuilder, allParse) {
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
            return {
                element: element,
                init: function () { },
                destroy: function () { }
            };
        });
    };
});
