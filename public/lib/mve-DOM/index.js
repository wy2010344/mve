define(["require", "exports", "./DOM", "../mve/index"], function (require, exports, DOM, index_1) {
    "use strict";
    exports.__esModule = true;
    exports.newline = exports.parseSVG = exports.parseHTML = exports.reDefineActionHandler = exports.DOMVirtualParam = void 0;
    var DOMVirtualParam = /** @class */ (function () {
        function DOMVirtualParam(pel) {
            this.pel = pel;
        }
        DOMVirtualParam.prototype.append = function (el, isMove) {
            DOM.appendChild(this.pel, el, isMove);
        };
        DOMVirtualParam.prototype.remove = function (el) {
            DOM.removeChild(this.pel, el);
        };
        DOMVirtualParam.prototype.insertBefore = function (el, oldEl, isMove) {
            DOM.insertChildBefore(this.pel, el, oldEl, isMove);
        };
        return DOMVirtualParam;
    }());
    exports.DOMVirtualParam = DOMVirtualParam;
    function reDefineActionHandler(e, fun) {
        if (e) {
            if (typeof (e) == "function") {
                return fun(e);
            }
            else {
                e.handler = fun(e.handler);
                return e;
            }
        }
    }
    exports.reDefineActionHandler = reDefineActionHandler;
    function buildParam(me, el, child) {
        if (child.id) {
            child.id(el);
        }
        if (child.action) {
            mb.Object.forEach(child.action, function (v, k) {
                DOM.action(el, k, v);
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
        //value必须在Attr后面才行，不然type=range等会无效
        if (child.value != null) {
            index_1.parseUtil.bind(me, child.value, function (v) {
                DOM.value(el, v);
            });
        }
        if (child.text != null) {
            index_1.parseUtil.bind(me, child.text, function (v) {
                DOM.content(el, v);
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
                var element_1 = DOM.createElement(child.type);
                buildParam(me, element_1, child);
                var childResult_1 = buildChildren(me, element_1, child, exports.parseHTML.children);
                return {
                    element: element_1,
                    init: function () {
                        if (childResult_1) {
                            childResult_1.init();
                        }
                        if (child.init) {
                            child.init(element_1);
                        }
                    },
                    destroy: function () {
                        if (child.destroy) {
                            child.destroy(element_1);
                        }
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
        var childResult = buildChildren(me, element, child, child.type == "foreignObject" ? exports.parseHTML.children : exports.parseSVG.children);
        return {
            element: element,
            init: function () {
                if (childResult) {
                    childResult.init();
                }
                if (child.init) {
                    child.init(element);
                }
            },
            destroy: function () {
                if (child.destroy) {
                    child.destroy(element);
                }
                if (childResult) {
                    childResult.destroy();
                }
            }
        };
    });
    exports.newline = { type: "br" };
});
