define(["require", "exports", "./index"], function (require, exports, index_1) {
    "use strict";
    exports.__esModule = true;
    exports.top_simple_navigation = void 0;
    function top_simple_navigation(p) {
        return index_1.navigation({
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
                        {
                            type: "div",
                            style: {
                                height: "30px"
                            },
                            children: [
                                {
                                    type: "button",
                                    text: "返回上一页",
                                    style: {
                                        display: on_hidden
                                    },
                                    action: {
                                        click: x.pop
                                    }
                                },
                                {
                                    type: "span",
                                    text: "|",
                                    style: {
                                        display: on_hidden
                                    }
                                },
                                {
                                    type: "button",
                                    text: "<",
                                    style: {
                                        display: on_hidden
                                    },
                                    action: {
                                        click: function () {
                                            var c = contentElement;
                                            c.scrollLeft = c.scrollLeft - 10;
                                        }
                                    }
                                },
                                {
                                    type: "span",
                                    id: function (v) {
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
                                    action: {
                                        wheel: function (e) {
                                            var c = contentElement;
                                            c.scrollLeft = c.scrollLeft + e.wheelDelta;
                                        }
                                    },
                                    children: [
                                        {
                                            type: "span",
                                            style: {
                                                "white-space": "nowrap"
                                            },
                                            children: v.build_head_children(function (me, row, index) {
                                                return {
                                                    type: "span",
                                                    children: [
                                                        {
                                                            type: "a",
                                                            attr: {
                                                                href: function () {
                                                                    return (x.size() - 1 == index()) ? null : "javascript:void(0)";
                                                                }
                                                            },
                                                            action: {
                                                                click: function () {
                                                                    while (row != x.current()) {
                                                                        x.pop();
                                                                    }
                                                                }
                                                            },
                                                            text: row.title
                                                        },
                                                        {
                                                            type: "span",
                                                            text: ">",
                                                            style: {
                                                                display: function () {
                                                                    return (index() == x.size() - 1) ? "none" : "";
                                                                }
                                                            }
                                                        }
                                                    ]
                                                };
                                            })
                                        }
                                    ]
                                },
                                {
                                    type: "button",
                                    text: ">",
                                    style: {
                                        display: on_hidden
                                    },
                                    action: {
                                        click: function () {
                                            var c = contentElement;
                                            c.scrollLeft = c.scrollLeft + 10;
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            type: "div",
                            children: v.build_body_children(function (me, row, index) {
                                return row.render(me, content_param);
                            })
                        }
                    ]
                };
            }
        });
    }
    exports.top_simple_navigation = top_simple_navigation;
});
