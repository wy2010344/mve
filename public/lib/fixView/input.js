define(["require", "exports", "../mve/index", "./util"], function (require, exports, index_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.inputBuilder = function (getAllBuilder, allParse) {
        return index_1.parseOf(function (me, child) {
            var element = document.createElement("input");
            util_1.buildAbs(me, element, child);
            if (child.id) {
                child.id(element);
            }
            if (child.value) {
                index_1.parseUtil.bind(me, child.value, function (v) {
                    element.value = v;
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
