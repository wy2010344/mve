define(["require", "exports", "./util", "../index", "../mve/index", "../BNavigationView"], function (require, exports, util_1, index_1, index_2, BNavigationView_1) {
    "use strict";
    exports.__esModule = true;
    exports.stackBuilder = function (getAllBuilder, allParse) {
        var parseStackItem = index_2.parseOf(function (me, child) {
            var element = new index_1.BView();
            var childResult = allParse.children(me, new util_1.BViewVirtualParam(element), child.children);
            return {
                element: element,
                destroy: function () {
                    childResult.destroy();
                }
            };
        });
        return index_2.parseOf(function (me, child) {
            var element = new index_1.BView();
            var stack = new BNavigationView_1.BStack(me, element);
            index_2.parseUtil.bind(me, child.x, function (v) {
                element.kSetX(v);
            });
            index_2.parseUtil.bind(me, child.y, function (v) {
                element.kSetY(v);
            });
            index_2.parseUtil.bind(me, child.w, function (v) {
                element.kSetW(v);
            });
            index_2.parseUtil.bind(me, child.h, function (v) {
                element.kSetH(v);
            });
            if (child.background) {
                index_2.parseUtil.bind(me, child.background, function (v) {
                    element.setBackground(v);
                });
            }
            var childResult = parseStackItem.children(me, new util_1.BArrayVirtualParam(stack), child.children);
            return {
                element: element,
                destroy: function () {
                    childResult.destroy();
                }
            };
        });
    };
});
