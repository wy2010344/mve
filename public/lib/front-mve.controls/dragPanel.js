var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
define(["require", "exports", "../mve-DOM/index", "../mve-DOM/other/drag", "../mve-DOM/other/resize", "../mve/util", "./window/form"], function (require, exports, index_1, drag_1, resize_1, util_1, form_1) {
    "use strict";
    exports.__esModule = true;
    exports.dragPanel = void 0;
    /**
     * 单个拖拽面板，伪窗口
     * @param fun
     */
    function dragPanel(fun) {
        var firstShow = true;
        var show = util_1.mve.valueOf(false);
        var rect = {
            top: util_1.mve.valueOf(100),
            left: util_1.mve.valueOf(100),
            width: util_1.mve.valueOf(100),
            height: util_1.mve.valueOf(100),
            destroy: function () {
                if (!firstShow) {
                    util_1.orDestroy(dialog);
                    document.body.removeChild(dialog.element);
                }
            },
            show: function (v) {
                if (arguments.length == 1) {
                    if (v && firstShow) {
                        //首次初始化
                        document.body.appendChild(dialog.element);
                        util_1.orInit(dialog);
                        firstShow = false;
                    }
                    show(v);
                }
                else {
                    return show();
                }
            }
        };
        var dialog = index_1.parseHTML.mve(function (me) {
            var result = fun(me, rect);
            function addTop(x) {
                rect.top(rect.top() + x);
            }
            function addLeft(x) {
                rect.left(rect.left() + x);
            }
            var zoom = resize_1.resizeZoom({
                resize: drag_1.dragResizeHelper({
                    addTop: addTop,
                    addLeft: addLeft,
                    addWidth: function (x) {
                        rect.width(rect.width() + x);
                    },
                    addHeight: function (x) {
                        rect.height(rect.height() + x);
                    }
                })
            });
            var titleHeight = 20;
            result.element.style = result.element.style || {};
            result.element.style.width = function () {
                return rect.width() + "px";
            };
            result.element.style.height = function () {
                return rect.height() + "px";
            };
            var minClick = result.minClick || function () {
                show(false);
            };
            return {
                type: "div",
                init: result.init,
                destroy: result.destroy,
                style: form_1.addShadow({
                    position: "absolute",
                    display: function () {
                        return rect.show() && result.show() ? "" : "none";
                    },
                    border: "1px solid gray",
                    background: "white",
                    left: function () { return rect.left() + "px"; },
                    top: function () { return rect.top() + "px"; },
                    width: function () { return rect.width() + "px"; },
                    height: function () { return rect.height() + titleHeight + "px"; }
                }),
                children: __spreadArrays([
                    {
                        type: "div", text: result.title, style: { cursor: "pointer", height: titleHeight + "px", "line-height": titleHeight + "px" },
                        action: {
                            mousedown: drag_1.dragMoveHelper({
                                diff: function (v) {
                                    var vx = v.x;
                                    if (vx != 0) {
                                        addLeft(vx);
                                    }
                                    var vy = v.y;
                                    if (vy != 0) {
                                        addTop(vy);
                                    }
                                }
                            })
                        }
                    },
                    {
                        type: "div",
                        text: "-",
                        style: {
                            position: "absolute", height: titleHeight - 2 + "px", "line-height": titleHeight - 2 + "px",
                            top: "0px", right: "0px", cursor: "pointer", width: titleHeight - 2 + "px",
                            "text-align": "center",
                            border: "1px solid black"
                        },
                        action: {
                            click: minClick
                        }
                    },
                    result.element
                ], zoom)
            };
        });
        return rect;
    }
    exports.dragPanel = dragPanel;
});
