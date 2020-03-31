define(["require", "exports", "./DOM", "../mve/index"], function (require, exports, DOM, index_1) {
    "use strict";
    exports.__esModule = true;
    var DOMVirtualParam = /** @class */ (function () {
        function DOMVirtualParam(pel) {
            this.pel = pel;
        }
        DOMVirtualParam.prototype.append = function (el) {
            DOM.appendChild(this.pel, el);
        };
        DOMVirtualParam.prototype.remove = function (el) {
            DOM.removeChild(this.pel, el);
        };
        DOMVirtualParam.prototype.insertBefore = function (el, oldEl) {
            DOM.insertChildBefore(this.pel, el, oldEl);
        };
        return DOMVirtualParam;
    }());
    exports.DOMVirtualParam = DOMVirtualParam;
    function buildParam(me, el, child) {
        if (child.id) {
            child.id(el);
        }
        if (child.value) {
            index_1.parseUtil.bind(me, child.value, function (v) {
                DOM.value(el, v);
            });
        }
        if (child.text) {
            index_1.parseUtil.bind(me, child.text, function (v) {
                DOM.content(el, v);
            });
        }
        if (child.style) {
            index_1.parseUtil.bindKV(me, child.style, function (k, v) {
                DOM.style(el, k, v);
            });
        }
        if (child.attr) {
            index_1.parseUtil.bindKV(me, child.attr, function (k, v) {
                DOM.attr(el, k, v);
            });
        }
        if (child.prop) {
            index_1.parseUtil.bindKV(me, child.prop, function (k, v) {
                DOM.prop(el, k, v);
            });
        }
        if (child.action) {
            mb.Object.forEach(child.action, function (v, k) {
                DOM.action(el, k, v);
            });
        }
    }
    function buildChildren(me, el, child, buildChildren) {
        if (child.children) {
            if (child.text) {
                mb.log("已经有text了，不应该有children", child);
            }
            else {
                return buildChildren(me, new DOMVirtualParam(el), child.children);
            }
        }
    }
    exports.parseHTML = index_1.parseOf(function (me, child) {
        if (typeof (child) == 'string') {
            return {
                element: DOM.createTextNode(child),
                init: function () { },
                destroy: function () { }
            };
        }
        else if (child) {
            if (child.type == "svg") {
                return exports.parseSVG.view(me, child);
            }
            else {
                var element = DOM.createElement(child.type);
                buildParam(me, element, child);
                var childResult_1 = buildChildren(me, element, child, exports.parseHTML.children);
                return {
                    element: element,
                    init: function () {
                        if (childResult_1) {
                            childResult_1.init();
                        }
                    },
                    destroy: function () {
                        if (childResult_1) {
                            childResult_1.destroy();
                        }
                    }
                };
            }
        }
        else {
            mb.log("child\u4E3A\u7A7A\uFF0C\u4E0D\u751F\u6210\u4EFB\u4F55\u4E1C\u897F");
        }
    });
    exports.parseSVG = index_1.parseOf(function (me, child) {
        var element = DOM.createElementNS(child.type, "http://www.w3.org/2000/svg");
        buildParam(me, element, child);
        var childResult = buildChildren(me, element, child, exports.parseSVG.children);
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
});
