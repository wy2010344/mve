define(["require", "exports", "../mve/childrenBuilder", "../mve/index", "../mve/util", "./DOM"], function (require, exports, childrenBuilder_1, index_1, util_1, DOM) {
    "use strict";
    exports.__esModule = true;
    exports.clsOf = exports.idOf = exports.svg = exports.dom = exports.reWriteDestroy = exports.reWriteInit = exports.reWriteEvent = exports.DOMVirtualParam = void 0;
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
    function reWriteEvent(n, eventName, fun) {
        var v = n[eventName];
        if (mb.Array.isArray(v)) {
            n[eventName] = fun(v);
        }
        else if (v) {
            n[eventName] = fun([v]);
        }
        else {
            n[eventName] = fun([]);
        }
    }
    exports.reWriteEvent = reWriteEvent;
    function reWriteInit(v, fun) {
        if (mb.Array.isArray(v.init)) {
            v.init = fun(v.init);
        }
        else if (v.init) {
            v.init = fun([v.init]);
        }
        else {
            v.init = fun([]);
        }
    }
    exports.reWriteInit = reWriteInit;
    function reWriteDestroy(v, fun) {
        if (mb.Array.isArray(v.destroy)) {
            v.destroy = fun(v.destroy);
        }
        else if (v.destroy) {
            v.destroy = fun([v.destroy]);
        }
        else {
            v.destroy = fun([]);
        }
    }
    exports.reWriteDestroy = reWriteDestroy;
    function buildParam(me, el, child) {
        if (child.event) {
            mb.Object.forEach(child.event, function (v, k) {
                if (mb.Array.isArray(v)) {
                    mb.Array.forEach(v, function (v) {
                        DOM.event(el, k, v);
                    });
                }
                else {
                    DOM.event(el, k, v);
                }
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
        if (child.cls) {
            index_1.parseUtil.bind(me, child.cls, function (v) {
                DOM.attr(el, "class", v);
            });
        }
        if (child.id) {
            index_1.parseUtil.bind(me, child.id, function (v) {
                DOM.attr(el, "id", v);
            });
        }
        if (child.text) {
            index_1.parseUtil.bind(me, child.text, function (v) {
                DOM.content(el, v);
            });
        }
        var ci = {};
        if (child.init) {
            if (mb.Array.isArray(child.init)) {
                var inits = child.init;
                for (var _i = 0, inits_1 = inits; _i < inits_1.length; _i++) {
                    var init = inits_1[_i];
                    init(el, me);
                }
            }
            else {
                var init_1 = child.init;
                ci.init = function () {
                    init_1(el, me);
                };
            }
        }
        if (child.destroy) {
            if (mb.Array.isArray(child.destroy)) {
                var destroys_1 = child.destroy;
                ci.destroy = function () {
                    for (var _i = 0, destroys_2 = destroys_1; _i < destroys_2.length; _i++) {
                        var destroy = destroys_2[_i];
                        destroy(el);
                    }
                };
            }
            else {
                var destroy_1 = child.destroy;
                ci.destroy = function () {
                    destroy_1(el);
                };
            }
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
    exports.dom = index_1.buildElementOrginal(function (me, n, life) {
        if (typeof (n) == 'string') {
            var txt = DOM.createTextNode(n);
            if (life) {
                return { element: txt, init: life.init, destroy: life.destroy };
            }
            else {
                return { element: txt, init: null, destroy: null };
            }
        }
        else {
            var element = DOM.createElement(n.type);
            var out = util_1.BuildResultList.init();
            var ci = buildParam(me, element, n);
            if ('children' in n) {
                var children = n.children;
                if (children) {
                    out.push(childrenBuilder_1.childrenBuilder(me, new DOMVirtualParam(element), children));
                }
            }
            buildParamAfter(me, element, n);
            out.push(ci);
            if (life) {
                out.push(life);
            }
            return util_1.onceLife(out.getAsOne(element)).out;
        }
    });
    exports.svg = index_1.buildElement(function (me, n, out) {
        var element = DOM.createElementNS(n.type, "http://www.w3.org/2000/svg");
        var ci = buildParam(me, element, n);
        if ('children' in n) {
            var children = n.children;
            if (children) {
                out.push(childrenBuilder_1.childrenBuilder(me, new DOMVirtualParam(element), children));
            }
        }
        buildParamAfter(me, element, n);
        out.push(ci);
        return element;
    });
    var idCount = 0;
    /**生成唯一ID*/
    function idOf(name) {
        return name + (idCount++);
    }
    exports.idOf = idOf;
    var clsCount = 0;
    /**生成唯一class */
    function clsOf(name) {
        return name + (clsCount++);
    }
    exports.clsOf = clsOf;
});
