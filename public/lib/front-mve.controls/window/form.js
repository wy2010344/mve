var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
define(["require", "exports", "./index", "./title", "../../mve-DOM/index", "../../mve/util", "../../mve-DOM/other/drag", "../../mve-DOM/other/resize"], function (require, exports, index_1, title_1, index_2, util_1, drag_1, resize_1) {
    "use strict";
    exports.__esModule = true;
    exports.addShadow = exports.autoMenuNode = exports.autoMenuMouse = exports.topTitleResizeForm = exports.resizeForm = exports.baseResizeForm = void 0;
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
                function currentWidth() {
                    return result.width() + "px";
                }
                function currentHeight() {
                    return result.height() + "px";
                }
                return {
                    left: function () { return result.left() + "px"; },
                    top: function () { return result.top() + "px"; },
                    width: currentWidth,
                    height: currentHeight,
                    panels: result.panels,
                    shadow: result.shadow,
                    style: result.style,
                    element: __spreadArray([
                        element
                    ], zoom)
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
            width: util_1.mve.valueOf(800),
            height: util_1.mve.valueOf(600),
            max: util_1.mve.valueOf(mb.DOM.isMobile()),
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
                    var titleHeight = 25;
                    var rect = {
                        out: out,
                        index: rp.index,
                        innerHeight: function () {
                            if (out.max()) {
                                return p.height() - titleHeight;
                            }
                            else {
                                return out.height();
                            }
                        },
                        innerWidth: function () {
                            if (out.max()) {
                                return p.width();
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
                        height: titleHeight,
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
                                return out.width();
                            }
                        },
                        height: function () {
                            if (out.max()) {
                                return p.height();
                            }
                            else {
                                return out.height() + titleHeight;
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
                        shadow: result.shadow,
                        shadowClick: result.shadowClick,
                        panels: result.panels,
                        element: index_2.dom({
                            type: "div",
                            init: result.init,
                            destroy: result.destroy,
                            style: addShadow({
                                background: "#ededed",
                                "border-radius": "5px"
                            }),
                            children: [
                                title,
                                index_2.dom({
                                    type: "div",
                                    style: mb.Object.ember(result.style || {}, {
                                        width: function () {
                                            return rect.innerWidth() + "px";
                                        },
                                        height: function () {
                                            return rect.innerHeight() + "px";
                                        }
                                    }),
                                    children: result.element
                                })
                            ]
                        })
                    };
                },
                focus: focus
            })
        };
    }
    exports.topTitleResizeForm = topTitleResizeForm;
    /**
     * 以x方向为例，菜单的最终位置
     * @param x 鼠标触发的在父容器下的x
     * @param pwidth 父容器宽度
     * @param width 自己的宽度
     * @returns 菜单应该放置的宽度
     */
    function menuLV(x, pwidth, width) {
        var after = x + width;
        if (after > pwidth) {
            //会超出,尝试向前
            var before = x - width;
            if (before < 0) {
                //尝试向前也会超出
                if (after > before) {
                    //向后超出的多
                    return before;
                }
                else {
                    return x;
                }
            }
            else {
                return before;
            }
        }
        else {
            return x;
        }
    }
    /**
     * 计算鼠标事件导致的相对位置
     * @param e
     * @param pe
     * @param me
     * @returns
     */
    function autoMenuMouse(e, pe, me) {
        return {
            x: menuLV(e.clientX - pe.left, pe.width, me.width),
            y: menuLV(e.clientY - pe.top, pe.height, me.height)
        };
    }
    exports.autoMenuMouse = autoMenuMouse;
    function menuNode(rtop, rleft, peWidth, peHeight, eWidth, eHeight, meWidth, meHeight) {
        var x = 0;
        var y = 0;
        var diffDownTop = peHeight - (rtop + eHeight + meHeight);
        if (diffDownTop > 0) {
            y = rtop + eHeight;
        }
        else {
            var diffUpTop = rtop - meHeight;
            if (diffUpTop > 0) {
                y = diffUpTop;
            }
            else {
                if (diffUpTop < diffDownTop) {
                    //上面更小，依下面
                    y = rtop + eHeight;
                }
                else {
                    y = diffUpTop;
                }
            }
        }
        var rd = peWidth - (rleft + meWidth);
        if (rd > 0) {
            //靠左
            x = rleft;
        }
        else {
            var ld = rleft + eWidth - meWidth;
            if (ld > 0) {
                //靠右
                x = ld;
            }
            else {
                if (ld < rd) {
                    //超得多，
                    x = rleft;
                }
                else {
                    //靠右
                    x = ld;
                }
            }
        }
        return [x, y];
    }
    /**
     * 自动排布菜单，相对定位
     * @param e 环绕元素
     * @param pe 父元素
     * @param me 菜单元素
     * @param dir 上下结构还是左右结构，默认上下结构y
     */
    function autoMenuNode(e, pe, me, dir) {
        if (dir === void 0) { dir = "y"; }
        var rtop = e.top - pe.top;
        var rleft = e.left - pe.left;
        if (dir == "x") {
            var _a = menuNode(rleft, rtop, pe.height, pe.width, e.height, e.width, me.height, me.width), y = _a[0], x = _a[1];
            return { x: x, y: y };
        }
        else {
            var _b = menuNode(rtop, rleft, pe.width, pe.height, e.width, e.height, me.width, me.height), x = _b[0], y = _b[1];
            return { x: x, y: y };
        }
    }
    exports.autoMenuNode = autoMenuNode;
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
