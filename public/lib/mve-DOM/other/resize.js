define(["require", "exports", "../index"], function (require, exports, index_1) {
    "use strict";
    exports.__esModule = true;
    exports.resizeZoom = void 0;
    function resizeZoom(p) {
        function makeResize(dir) {
            return function (e) {
                e = e || window.event;
                p.resize(e, dir);
            };
        }
        ;
        var display = p.allow ? function () {
            return p.allow() ? "" : "none";
        } : "";
        return [
            //四边
            index_1.dom({
                type: "div",
                style: {
                    display: display,
                    width: "100%",
                    height: "7px",
                    position: "absolute",
                    top: "-3px",
                    left: "0",
                    cursor: "n-resize"
                },
                event: {
                    mousedown: makeResize({ t: true })
                }
            }),
            index_1.dom({
                type: "div",
                style: {
                    display: display,
                    width: "7px",
                    height: "100%",
                    position: "absolute",
                    right: "-3px",
                    top: "0",
                    cursor: "e-resize"
                },
                event: {
                    mousedown: makeResize({ r: true })
                }
            }),
            index_1.dom({
                type: "div",
                style: {
                    display: display,
                    width: "7px",
                    height: "100%",
                    position: "absolute",
                    left: "-3px",
                    top: "0",
                    cursor: "w-resize"
                },
                event: {
                    mousedown: makeResize({ l: true })
                }
            }),
            index_1.dom({
                type: "div",
                style: {
                    display: display,
                    width: "100%",
                    height: "7px",
                    position: "absolute",
                    bottom: "-3px",
                    left: "0",
                    cursor: "s-resize"
                },
                event: {
                    mousedown: makeResize({ b: true })
                }
            }),
            index_1.dom({
                type: "div",
                style: {
                    display: display,
                    width: "15px",
                    height: "15px",
                    position: "absolute",
                    top: "-7px",
                    left: "-7px",
                    cursor: "nw-resize"
                },
                event: {
                    mousedown: makeResize({ t: true, l: true })
                }
            }),
            index_1.dom({
                type: "div",
                style: {
                    display: display,
                    width: "15px",
                    height: "15px",
                    position: "absolute",
                    top: "-7px",
                    right: "-7px",
                    cursor: "ne-resize"
                },
                event: {
                    mousedown: makeResize({ t: true, r: true })
                }
            }),
            index_1.dom({
                type: "div",
                style: {
                    display: display,
                    width: "15px",
                    height: "15px",
                    position: "absolute",
                    bottom: "-7px",
                    left: "-7px",
                    cursor: "sw-resize"
                },
                event: {
                    mousedown: makeResize({ b: true, l: true })
                }
            }),
            index_1.dom({
                type: "div",
                style: {
                    display: display,
                    width: "15px",
                    height: "15px",
                    position: "absolute",
                    bottom: "-7px",
                    right: "-7px",
                    cursor: "se-resize"
                },
                event: {
                    mousedown: makeResize({ b: true, r: true })
                }
            })
        ];
    }
    exports.resizeZoom = resizeZoom;
});
