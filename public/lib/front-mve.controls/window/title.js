define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.buildTitle = void 0;
    function buildTitle(p) {
        return {
            type: "div",
            style: {
                background: "#beceeb",
                cursor: "move"
            },
            action: {
                mousedown: function (e) {
                    p.move(e || window.event);
                }
            },
            children: [
                /*按钮部分*/
                {
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
                        display: function () {
                            return p.showClose() ? "" : "none";
                        }
                    },
                    action: {
                        mousedown: function (e) {
                            mb.DOM.stopPropagation(e);
                        },
                        click: p.close_click
                    }
                },
                {
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
                        display: function () {
                            if (mb.DOM.isMobile()) {
                                return "none";
                            }
                            else {
                                return p.showMax() ? "" : "none";
                            }
                        }
                    },
                    action: {
                        mousedown: function (e) {
                            mb.DOM.stopPropagation(e);
                        },
                        click: function () {
                            p.max(!p.max());
                        }
                    }
                },
                /*标题部分*/
                {
                    type: "div",
                    style: {
                        "font-weight": "bold",
                        "font-size": "15px",
                        "vertical-align": "middle",
                        display: "inline-block",
                        "margin": "0 5px",
                        color: "#120def"
                    },
                    text: p.title
                }
            ]
        };
    }
    exports.buildTitle = buildTitle;
});
