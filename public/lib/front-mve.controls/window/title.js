define(["require", "exports", "../../mve-DOM/index"], function (require, exports, index_1) {
    "use strict";
    exports.__esModule = true;
    exports.buildTitle = void 0;
    function buildTitle(p) {
        return index_1.dom({
            type: "div",
            style: {
                "background-image": "linear-gradient(180deg, #e6e6e6, #bab9ba)",
                cursor: "move",
                "border-radius": "5px 5px 0 0",
                "white-space": "nowrap",
                overflow: "hidden",
                "text-overflow": "ellipsis",
                height: p.height - 1 + "px",
                "line-height": p.height - 1 + "px",
                "border-bottom": "1px solid #696969"
            },
            event: {
                mousedown: function (e) {
                    p.move(e || window.event);
                }
            },
            children: [
                /*按钮部分*/
                index_1.dom({
                    type: "img",
                    attr: {
                        src: pathOf("./close.png"),
                        draggable: "false"
                    },
                    style: {
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                        "vertical-align": "middle",
                        backgroundColor: "white",
                        "border-radius": "5px",
                        "margin-left": "5px",
                        display: function () {
                            return p.showClose() ? "" : "none";
                        }
                    },
                    event: {
                        mousedown: function (e) {
                            mb.DOM.stopPropagation(e);
                        },
                        click: p.close_click
                    }
                }),
                index_1.dom({
                    type: "img",
                    attr: {
                        src: function () {
                            return p.max() ? pathOf("./normal.png") : pathOf("./max.png");
                        },
                        draggable: "false"
                    },
                    style: {
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                        "vertical-align": "middle",
                        backgroundColor: "white",
                        "border-radius": "5px",
                        "margin-left": "5px",
                        display: function () {
                            if (mb.DOM.isMobile()) {
                                return "none";
                            }
                            else {
                                return p.showMax() ? "" : "none";
                            }
                        }
                    },
                    event: {
                        mousedown: function (e) {
                            mb.DOM.stopPropagation(e);
                        },
                        click: function () {
                            p.max(!p.max());
                        }
                    }
                }),
                /*标题部分*/
                index_1.dom({
                    type: "div",
                    style: {
                        "font-weight": "bold",
                        "font-size": "15px",
                        "vertical-align": "middle",
                        display: "inline",
                        "margin": "0 5px",
                        color: "#645d61"
                    },
                    text: p.title
                })
            ]
        });
    }
    exports.buildTitle = buildTitle;
});
