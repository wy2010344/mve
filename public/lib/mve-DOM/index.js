define(["require", "exports", "./DOM", "../mve/index", "../mve/util"], function (require, exports, DOM, index_1, util_1) {
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
        if (child.cls) {
            index_1.parseUtil.bind(me, child.cls, function (v) {
                DOM.attr(el, "class", v);
            });
        }
        if (child.prop) {
            index_1.parseUtil.bindKV(me, child.prop, function (k, v) {
                DOM.prop(el, k, v);
            });
        }
        if (child.text) {
            index_1.parseUtil.bind(me, child.text, function (v) {
                DOM.content(el, v);
            });
        }
        var ci = {};
        if (child.init) {
            ci.init = function () {
                child.init(el);
            };
        }
        if (child.destroy) {
            ci.destroy = function () {
                child.destroy(el);
            };
        }
        return ci;
    }
    function buildParamAfter(me, el, child) {
        /**
         * value必须在Attr后面才行，不然type=range等会无效
         * select的value必须放在children后，不然会无效
         */
        if (child.value) {
            index_1.parseUtil.bind(me, child.value, function (v) {
                DOM.value(el, v);
            });
        }
    }
    function buildChildren(me, el, child, buildChildren) {
        if (child.children) {
            if (child.text) {
                mb.log("text与children冲突");
            }
            else {
                return buildChildren(me, new DOMVirtualParam(el), child.children);
            }
        }
    }
    function buildResult(element, ci, childResult) {
        var out = util_1.BuildResultList.init();
        out.orPush(childResult);
        out.push(ci);
        return util_1.onceLife({
            element: element,
            init: out.getInit(),
            destroy: out.getDestroy()
        }).out;
    }
    exports.parseHTML = index_1.parseOf(function (me, child) {
        if (typeof (child) == 'string') {
            return {
                element: DOM.createTextNode(child)
            };
        }
        else if (child) {
            if (child.type == "svg") {
                return exports.parseSVG.view(me, child);
            }
            else {
                var element = DOM.createElement(child.type);
                var ci = buildParam(me, element, child);
                var childResult = buildChildren(me, element, child, exports.parseHTML.children);
                buildParamAfter(me, element, child);
                return buildResult(element, ci, childResult);
            }
        }
        else {
            mb.log("child\u4E3A\u7A7A\uFF0C\u4E0D\u751F\u6210\u4EFB\u4F55\u4E1C\u897F");
        }
    });
    exports.parseSVG = index_1.parseOf(function (me, child) {
        var element = DOM.createElementNS(child.type, "http://www.w3.org/2000/svg");
        var ci = buildParam(me, element, child);
        var childResult = buildChildren(me, element, child, child.type == "foreignObject" ? exports.parseHTML.children : exports.parseSVG.children);
        buildParamAfter(me, element, child);
        return buildResult(element, ci, childResult);
    });
    exports.newline = { type: "br" };
});
