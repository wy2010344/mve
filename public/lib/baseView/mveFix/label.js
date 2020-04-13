define(["require", "exports", "./util", "../index", "../mve/index"], function (require, exports, util_1, index_1, index_2) {
    "use strict";
    exports.__esModule = true;
    exports.labelBuilder = function (getAllBuilder, allParse) {
        return index_2.parseOf(function (me, child) {
            var element = new index_1.BLable();
            util_1.buildAbs(me, element, child);
            index_2.parseUtil.bind(me, child.text, function (v) {
                element.setText(v);
            });
            return {
                element: element,
                destroy: function () {
                }
            };
        });
    };
});
