define(["require", "exports", "../../mve/index", "../DOM", "./util"], function (require, exports, index_1, DOM, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.divBuilder = void 0;
    var divBuilder = function (getAllBuilder, allParse) {
        return index_1.parseOf(function (me, child) {
            var element = document.createElement("div");
            if (child.id) {
                child.id(element);
            }
            if (child.text) {
                index_1.parseUtil.bind(me, child.text, function (v) {
                    DOM.text(element, v);
                });
            }
            if (child.style) {
                index_1.parseUtil.bindKV(me, child.style, function (k, v) {
                    DOM.style(element, k, v);
                });
            }
            if (child.attr) {
                index_1.parseUtil.bindKV(me, child.attr, function (k, v) {
                    DOM.attr(element, k, v);
                });
            }
            if (child.prop) {
                index_1.parseUtil.bindKV(me, child.prop, function (k, v) {
                    DOM.prop(element, k, v);
                });
            }
            if (child.action) {
                mb.Object.forEach(child.action, function (v, k) {
                    DOM.action(element, k, v);
                });
            }
            var childResult = child.children ? allParse.children(me, new util_1.DOMVirtualParam(element), child.children) : null;
            return {
                element: element,
                init: function () {
                    if (childResult) {
                        childResult.init();
                    }
                },
                destroy: function () {
                    if (childResult) {
                        childResult.destroy();
                    }
                }
            };
        });
    };
    exports.divBuilder = divBuilder;
});
