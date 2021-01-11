define(["require", "exports", "../index", "../mve/index", "./util"], function (require, exports, index_1, index_2, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.gridBuilder = void 0;
    var gridBuilder = function (getAllBuilder, allParse) {
        var parseStackItem = index_2.parseOf(function (me, child) {
            var stackItem = new index_1.BGridItem();
            var childResult = allParse.children(me, new util_1.BViewVirtualParam(stackItem.view), child.children);
            return {
                element: stackItem,
                destroy: function () {
                    childResult.destroy();
                }
            };
        });
        return index_2.parseOf(function (me, child) {
            var grid = new index_1.BGrid(me);
            index_2.parseUtil.bind(me, child.cellW, function (w) {
                grid.cellWidth(w);
            });
            index_2.parseUtil.bind(me, child.cellH, function (h) {
                grid.cellHeight(h);
            });
            index_2.parseUtil.bind(me, child.columnNum, function (n) {
                grid.columnNum(n);
            });
            var childResult = parseStackItem.children(me, new index_1.BGridVirtualParam(grid), child.children);
            return {
                element: grid.view,
                destroy: function () {
                    childResult.destroy();
                }
            };
        });
    };
    exports.gridBuilder = gridBuilder;
});
