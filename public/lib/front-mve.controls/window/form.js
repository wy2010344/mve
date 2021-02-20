var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
define(["require", "exports", "./index", "./title", "../../mve/util", "../../mve-DOM/other/drag", "../../mve-DOM/other/resize"], function (require, exports, index_1, title_1, util_1, drag_1, resize_1) {
    "use strict";
    exports.__esModule = true;
    exports.addShadow = exports.topTitleResizeForm = exports.resizeForm = exports.baseResizeForm = void 0;
    /**
     * 标题栏可以放在顶部，也可以放在底部
     * 首先没有标题栏，只有位置可变化
     * 最大化禁止外部位置变化，但不禁止内部的业务尺寸
     * 不使用绝对尺寸，是为了兼容最大化。
     * 很可能有移动，先做好
     * @param fun
     */
    function baseResizeForm(x) {
        return index_1.formBuilder({
            hide: x.hide,
            focus: x.focus,
            render: function (me, p, index) {
                var result = x.render(me, p, {
                    move: drag_1.dragMoveHelper({
                        diffX: function (x) {
                            result.addLeft(x);
                        },
                        diffY: function (y) {
                            result.addTop(y);
                        }
                    }),
                    index: index
                });
                var zoom = resize_1.resizeZoom({
                    allow: result.allow,
                    resize: drag_1.dragResizeHelper({
                        allow: result.allow,
                        addTop: result.addTop,
                        addHeight: result.addHeight,
                        addLeft: result.addLeft,
                        addWidth: result.addWidth
                    })
                });
                var element = result.element;
                element.style = element.style || {};
                function currentWidth() {
                    return result.width() + "px";
                }
                function currentHeight() {
                    return result.height() + "px";
                }
                addShadow(element.style);
                return {
                    left: function () { return result.left() + "px"; },
                    top: function () { return result.top() + "px"; },
                    width: currentWidth,
                    height: currentHeight,
                    panels: result.panels,
                    element: {
                        type: "div",
                        children: __spreadArrays([
                            element
                        ], zoom)
                    }
                };
            }
        });
    }
    exports.baseResizeForm = baseResizeForm;
    function resizeForm(fun, focus) {
        var rect = {
            left: util_1.mve.valueOf(20),
            top: util_1.mve.valueOf(20),
            width: util_1.mve.valueOf(400),
            height: util_1.mve.valueOf(200),
            hide: util_1.mve.valueOf(false)
        };
        return {
            out: rect,
            panel: baseResizeForm({
                hide: rect.hide,
                focus: focus,
                render: function (me, p, r) {
                    var result = fun(me, p, {
                        out: rect,
                        index: r.index,
                        move: r.move
                    });
                    return {
                        shadowClick: result.shadowClick,
                        allow: result.allow,
                        element: result.element,
                        addHeight: function (h) {
                            rect.height(rect.height() + h);
                        },
                        addLeft: function (l) {
                            rect.left(rect.left() + l);
                        },
                        addTop: function (t) {
                            rect.top(rect.top() + t);
                        },
                        addWidth: function (w) {
                            rect.width(rect.width() + w);
                        },
                        width: function () {
                            return rect.width();
                        },
                        height: function () {
                            return rect.height();
                        },
                        top: function () {
                            return rect.top();
                        },
                        left: function () {
                            return rect.left();
                        }
                    };
                }
            })
        };
    }
    exports.resizeForm = resizeForm;
    function topTitleResizeForm(fun, focus) {
        var out = {
            left: util_1.mve.valueOf(20),
            top: util_1.mve.valueOf(20),
            width: util_1.mve.valueOf(400),
            height: util_1.mve.valueOf(600),
            max: util_1.mve.valueOf(false),
            resizeAble: util_1.mve.valueOf(true),
            showClose: util_1.mve.valueOf(true),
            showMax: util_1.mve.valueOf(true),
            hide: util_1.mve.valueOf(false)
        };
        return {
            out: out,
            panel: baseResizeForm({
                hide: out.hide,
                render: function (me, p, rp) {
                    var rect = {
                        out: out,
                        index: rp.index,
                        innerHeight: function () {
                            if (out.max()) {
                                return p.height() - 20 - 10;
                            }
                            else {
                                return out.height();
                            }
                        },
                        innerWidth: function () {
                            if (out.max()) {
                                return p.width() - 10;
                            }
                            else {
                                return out.width();
                            }
                        },
                        hideToFirst: function () {
                            out.hide(true);
                            p.model.moveToFirst(rp.index());
                        },
                        showAtLast: function () {
                            out.hide(false);
                            p.model.moveToLast(rp.index());
                        }
                    };
                    var result = fun(me, p, rect);
                    var title = title_1.buildTitle({
                        move: rp.move,
                        title: result.title,
                        close_click: function () {
                            if (result.close) {
                                result.close();
                            }
                            else {
                                p.model.remove(rp.index());
                            }
                        },
                        max: out.max,
                        showClose: out.showClose,
                        showMax: out.showMax
                    });
                    var element = result.element;
                    element.style = element.style || {};
                    element.style.width = function () {
                        return rect.innerWidth() + "px";
                    };
                    element.style.height = function () {
                        return rect.innerHeight() + "px";
                    };
                    /*
                    element.style.background=function(){
                        return gstate()?"#f0f3f9":"black"
                    }
                    */
                    return {
                        allow: function () {
                            if (out.max()) {
                                return false;
                            }
                            else if (out.resizeAble()) {
                                return true;
                            }
                            else {
                                return false;
                            }
                        },
                        addHeight: function (h) {
                            out.height(out.height() + h);
                        },
                        addLeft: function (l) {
                            out.left(out.left() + l);
                        },
                        addTop: function (t) {
                            out.top(out.top() + t);
                        },
                        addWidth: function (w) {
                            out.width(out.width() + w);
                        },
                        width: function () {
                            if (out.max()) {
                                return p.width();
                            }
                            else {
                                return 10 + out.width();
                            }
                        },
                        height: function () {
                            if (out.max()) {
                                return p.height();
                            }
                            else {
                                return 10 + out.height() + 20;
                            }
                        },
                        top: function () {
                            if (out.max()) {
                                return 0;
                            }
                            else {
                                return out.top();
                            }
                        },
                        left: function () {
                            if (out.max()) {
                                return 0;
                            }
                            else {
                                return out.left();
                            }
                        },
                        shadowClick: result.shadowClick,
                        panels: result.panels,
                        element: {
                            type: "div",
                            init: result.init,
                            destroy: result.destroy,
                            style: {
                                padding: "5px",
                                background: "#f0f3f9"
                            },
                            children: [
                                title,
                                element
                            ]
                        }
                    };
                },
                focus: focus
            })
        };
    }
    exports.topTitleResizeForm = topTitleResizeForm;
    function addShadow(style) {
        var shadow = "rgb(102, 102, 102) 0px 0px 20px 5px"; //"20px 20px 40px #666666";
        style["box-shadow"] = shadow;
        style["-webkit-box-shadow"] = shadow;
        style["-moz-box-shadow"] = shadow;
        style.filter = "progid:DXImageTransform.Microsoft.Shadow(color=#666666,direction=120,strength=40)";
        return style;
    }
    exports.addShadow = addShadow;
});
