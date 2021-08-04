define(["require", "exports", "../../mve-DOM/index", "../../mve-DOM/other/drag", "../../mve/util", "./index"], function (require, exports, index_1, drag_1, util_1, index_2) {
    "use strict";
    exports.__esModule = true;
    exports.top_tab = void 0;
    function top_tab(me, p) {
        return index_2.tab(me, {
            tabs: p.tabs,
            current: p.current || util_1.mve.valueOf(null),
            render: function (me, x) {
                function on_hiden() {
                    return p.tabs.size() > 0 ? "" : "none";
                }
                ;
                var contentSpan;
                return index_1.dom({
                    type: "div",
                    children: [
                        index_1.dom({
                            type: "div",
                            children: [
                                index_1.dom({
                                    type: "button",
                                    text: "<",
                                    style: {
                                        display: on_hiden
                                    },
                                    action: {
                                        click: function () {
                                            var c = contentSpan;
                                            c.scrollLeft = c.scrollLeft - 10;
                                        }
                                    }
                                }),
                                index_1.dom({
                                    type: "span",
                                    id: function (v) {
                                        contentSpan = v;
                                    },
                                    style: {
                                        display: "inline-block",
                                        overflow: "hidden",
                                        "vertical-align": "middle",
                                        width: function () {
                                            if (p.tabs.size() > 0) {
                                                return p.width() - 60 + "px";
                                            }
                                        }
                                    },
                                    action: {
                                        wheel: function (e) {
                                            var c = contentSpan;
                                            c.scrollLeft = c.scrollLeft + mb.DOM.wheelDelta(e);
                                        }
                                    },
                                    children: [
                                        index_1.dom({
                                            type: "span",
                                            style: {
                                                "white-space": "nowrap"
                                            },
                                            children: x.build_head_children(function (me, row, index) {
                                                var left = util_1.mve.valueOf(0);
                                                var div;
                                                return {
                                                    type: "div",
                                                    init: function (it) {
                                                        div = it;
                                                    },
                                                    style: {
                                                        position: "relative",
                                                        left: function () {
                                                            return left() + "px";
                                                        },
                                                        display: "inline-block",
                                                        border: "1px solid gray",
                                                        padding: "2px",
                                                        margin: "1px",
                                                        color: function () {
                                                            return x.current() == row ? "white" : "black";
                                                        },
                                                        "background-color": function () {
                                                            return x.current() == row ? "green" : "";
                                                        },
                                                        cursor: "pointer",
                                                        "z-index": function () {
                                                            return x.current() == row ? p.tabs.size() + "" : "";
                                                        }
                                                    },
                                                    text: p.title(me, row, index),
                                                    action: {
                                                        mousedown: drag_1.dragMoveHelper({
                                                            diff: function (v) {
                                                                var lf = left() + v.x;
                                                                var ow = div.offsetWidth;
                                                                if (lf > ow / 2) {
                                                                    //向右移动
                                                                    p.tabs.move(index(), index() + 1);
                                                                    left(lf - ow); //小于0
                                                                }
                                                                else if (-lf > ow / 2) {
                                                                    //向左移动
                                                                    p.tabs.move(index(), index() - 1);
                                                                    left(lf + ow); //大于0
                                                                }
                                                                else {
                                                                    left(lf);
                                                                }
                                                            },
                                                            cancel: function () {
                                                                left(0);
                                                            }
                                                        })
                                                    }
                                                };
                                            })
                                        })
                                    ]
                                }),
                                index_1.dom({
                                    type: "button",
                                    text: ">",
                                    style: {
                                        display: on_hiden
                                    },
                                    action: {
                                        click: function () {
                                            var c = contentSpan;
                                            c.scrollLeft = c.scrollLeft + 10;
                                        }
                                    }
                                })
                            ]
                        }),
                        index_1.dom({
                            type: "div",
                            children: x.build_body_children(function (me, row, index) {
                                return p.render(me, row, index);
                            })
                        })
                    ]
                });
            }
        });
    }
    exports.top_tab = top_tab;
});
