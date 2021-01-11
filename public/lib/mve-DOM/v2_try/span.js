define(["require", "exports", "../../mve/index"], function (require, exports, index_1) {
    "use strict";
    exports.__esModule = true;
    exports.spanBuilder = void 0;
    var spanBuilder = function (getAllBuilder, allParse) {
        return index_1.parseOf(function (me, child) {
            var element = document.createElement("span");
            return {
                element: element,
                init: function () {
                },
                destroy: function () {
                }
            };
        });
    };
    exports.spanBuilder = spanBuilder;
});
