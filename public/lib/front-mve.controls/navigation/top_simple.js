define(["require", "exports", "../../mve-DOM/index", "./index"], function (require, exports, index_1, index_2) {
    "use strict";
    exports.__esModule = true;
    exports.top_simple_navigation = void 0;
    function top_simple_navigation(p) {
        return index_2.navigation({
            render: function (me, x, v) {
                var content_param = {
                    width: p.width,
                    height: function () {
                        return p.height() - 30;
                    }
                };
                var on_hidden = function () {
                    return x.size() == 1 ? "none" : "";
                };
                var contentElement;
                return {
                    init: function () {
                        p.init(x);
                    },
                    type: "div",
                    style: {
                        height: function () {
                            return p.height() + "px";
                        }
                    },
                    children: [
                        index_1.dom({
                            type: "div",
                            style: {
                                height: "30px"
                            },
                            children: [
                                index_1.dom({
                                    type: "button",
                                    text: "返回上一页",
                                    style: {
                                        display: on_hidden
                                    },
                                    event: {
                                        click: x.pop
                                    }
                                }),
                                index_1.dom({
                                    type: "span",
                                    text: "|",
                                    style: {
                                        display: on_hidden
                                    }
                                }),
                                index_1.dom({
                                    type: "button",
                                    text: "<",
                                    style: {
                                        display: on_hidden
                                    },
                                    event: {
                                        click: function () {
                                            var c = contentElement;
                                            c.scrollLeft = c.scrollLeft - 10;
                                        }
                                    }
                                }),
                                index_1.dom({
                                    type: "span",
                                    init: function (v) {
                                        contentElement = v;
                                    },
                                    style: {
                                        overflow: "hidden",
                                        display: "inline-block",
                                        "vertical-align": "middle",
                                        width: function () {
                                            var w = (x.size() == 1 ? p.width() : p.width() - 90);
                                            return w - 60 + "px";
                                        }
                                    },
                                    event: {
                                        wheel: function (e) {
                                            var c = contentElement;
                                            c.scrollLeft = c.scrollLeft + e.wheelDelta;
                                        }
                                    },
                                    children: [
                                        index_1.dom({
                                            type: "span",
                                            style: {
                                                "white-space": "nowrap"
                                            },
                                            children: v.build_head_children(function (me, row, index) {
                                                return index_1.dom({
                                                    type: "span",
                                                    children: [
                                                        index_1.dom({
                                                            type: "a",
                                                            attr: {
                                                                href: function () {
                                                                    return (x.size() - 1 == index()) ? null : "javascript:void(0)";
                                                                }
                                                            },
                                                            event: {
                                                                click: function () {
                                                                    while (row != x.current()) {
                                                                        x.pop();
                                                                    }
                                                                }
                                                            },
                                                            text: row.title
                                                        }),
                                                        index_1.dom({
                                                            type: "span",
                                                            text: ">",
                                                            style: {
                                                                display: function () {
                                                                    return (index() == x.size() - 1) ? "none" : "";
                                                                }
                                                            }
                                                        })
                                                    ]
                                                });
                                            })
                                        })
                                    ]
                                }),
                                index_1.dom({
                                    type: "button",
                                    text: ">",
                                    style: {
                                        display: on_hidden
                                    },
                                    event: {
                                        click: function () {
                                            var c = contentElement;
                                            c.scrollLeft = c.scrollLeft + 10;
                                        }
                                    }
                                })
                            ]
                        }),
                        index_1.dom({
                            type: "div",
                            children: v.build_body_children(function (me, row, index) {
                                return row.render(me, content_param);
                            })
                        })
                    ]
                };
            }
        });
    }
    exports.top_simple_navigation = top_simple_navigation;
});
