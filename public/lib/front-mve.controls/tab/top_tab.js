define(["require", "exports", "./index"], function (require, exports, index_1) {
    "use strict";
    exports.__esModule = true;
    exports.top_tab = void 0;
    function top_tab(me, p) {
        return index_1.tab(me, {
            tabs: p.tabs,
            current: p.current,
            render: function (me, x) {
                var on_hiden = function () {
                    return p.tabs.size() > 0 ? "" : "none";
                };
                var contentSpan;
                return {
                    type: "div",
                    children: [
                        {
                            type: "div",
                            children: [
                                {
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
                                },
                                {
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
                                            c.scrollLeft = c.scrollLeft + e.wheelDelta;
                                        }
                                    },
                                    children: [
                                        {
                                            type: "span",
                                            style: {
                                                "white-space": "nowrap"
                                            },
                                            children: x.build_head_children(function (me, row, index) {
                                                return {
                                                    type: "div",
                                                    style: {
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
                                                        cursor: "pointer"
                                                    },
                                                    text: p.title(me, row, index)
                                                };
                                            })
                                        }
                                    ]
                                },
                                {
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
                                }
                            ]
                        },
                        {
                            type: "div",
                            children: x.build_body_children(function (me, row, index) {
                                return p.render(me, row, index);
                            })
                        }
                    ]
                };
            }
        });
    }
    exports.top_tab = top_tab;
});
