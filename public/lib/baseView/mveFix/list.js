define(["require", "exports", "../index", "../mve/index", "./util"], function (require, exports, index_1, index_2, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.listBuilder = function (getAllBuilder, allParse) {
        var listItemParseOf = index_2.parseOf(function (me, child) {
            var element = new index_1.BListItem();
            index_2.parseUtil.bind(me, child.height, function (v) {
                element.height(v);
            });
            var childResult = allParse.children(me, new util_1.BViewVirtualParam(element.view), child.children);
            return {
                element: element,
                destroy: function () {
                    childResult.destroy();
                }
            };
        });
        return index_2.parseOf(function (me, child) {
            var list = new index_1.BList(me);
            if (child.x) {
                index_2.parseUtil.bind(me, child.x, function (v) {
                    list.view.kSetX(v);
                });
            }
            if (child.y) {
                index_2.parseUtil.bind(me, child.y, function (v) {
                    list.view.kSetY(v);
                });
            }
            index_2.parseUtil.bind(me, child.w, function (v) {
                list.width(v);
            });
            var childResult = listItemParseOf.children(me, new index_1.BListVirtualParam(list), child.children);
            return {
                element: list.view,
                destroy: function () {
                    childResult.destroy();
                }
            };
        });
    };
});
