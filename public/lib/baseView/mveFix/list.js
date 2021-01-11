define(["require", "exports", "../index", "../mve/index", "./util"], function (require, exports, index_1, index_2, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.scrollListBuilder = exports.listBuilder = exports.listItemBuilder = void 0;
    var listItemBuilder = function (getAllBuilder, allParse) {
        return index_2.parseOf(function (me, child) {
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
    };
    exports.listItemBuilder = listItemBuilder;
    var listBuilder = function (getAllBuilder, allParse) {
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
            var childResult = getAllBuilder().listItem.children(me, new index_1.BListVirtualParam(list), child.children);
            return {
                element: list.view,
                destroy: function () {
                    childResult.destroy();
                }
            };
        });
    };
    exports.listBuilder = listBuilder;
    var scrollListBuilder = function (getAllBuilder, allParse) {
        return index_2.parseOf(function (me, child) {
            var list = new index_1.BScrollList(me);
            if (child.x) {
                index_2.parseUtil.bind(me, child.x, function (v) {
                    list.outView.kSetX(v);
                });
            }
            if (child.y) {
                index_2.parseUtil.bind(me, child.y, function (v) {
                    list.outView.kSetY(v);
                });
            }
            index_2.parseUtil.bind(me, child.w, function (v) {
                list.width(v);
            });
            index_2.parseUtil.bind(me, child.h, function (v) {
                list.height(v);
            });
            var childResult = getAllBuilder().listItem.children(me, new index_1.BScrollListVirtualParam(list), child.children);
            return {
                element: list.outView,
                destroy: function () {
                    childResult.destroy();
                }
            };
        });
    };
    exports.scrollListBuilder = scrollListBuilder;
});
