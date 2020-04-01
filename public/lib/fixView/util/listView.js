define(["require", "exports", "../../mve/modelChildren"], function (require, exports, modelChildren_1) {
    "use strict";
    exports.__esModule = true;
    function listView(p) {
        function countModel(index) {
            var ah = 0;
            for (var i = 0; i < index; i++) {
                var h = p.model.get(i).h;
                if (typeof (h) == 'function') {
                    ah = ah + h();
                }
                else {
                    ah = ah + h;
                }
            }
            return ah;
        }
        return {
            type: "view",
            x: p.x, y: p.y, w: p.w, h: p.h,
            children: modelChildren_1.modelChildren(p.model, function (me, row, index) {
                return {
                    type: "view",
                    x: 0,
                    y: function () {
                        return countModel(index());
                    },
                    w: p.w,
                    h: row.h,
                    background: row.background,
                    children: row.children
                };
            })
        };
    }
    exports.listView = listView;
});
