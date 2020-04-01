define(["require", "exports", "../mve/index"], function (require, exports, index_1) {
    "use strict";
    exports.__esModule = true;
    function buildAbs(me, e, child) {
        e.style.position = "absolute";
        index_1.parseUtil.bind(me, child.x, function (v) {
            e.style.left = v + "px";
        });
        index_1.parseUtil.bind(me, child.y, function (v) {
            e.style.top = v + "px";
        });
        index_1.parseUtil.bind(me, child.w, function (v) {
            e.style.width = v + "px";
        });
        index_1.parseUtil.bind(me, child.h, function (v) {
            e.style.height = v + "px";
        });
    }
    exports.buildAbs = buildAbs;
});
