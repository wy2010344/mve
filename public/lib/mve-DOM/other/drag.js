define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.dragResizeHelper = exports.dragMoveHelper = void 0;
    function stopSelect() {
        document.body.style.webkitUserSelect = 'none';
        document.body.style["msUserSelect"] = 'none';
        document.body.style["mozUserSelect"] = 'none';
        document.body.style["user-select"] = "none";
    }
    function canSelect() {
        document.body.style.webkitUserSelect = '';
        document.body.style["msUserSelect"] = '';
        document.body.style["mozUserSelect"] = '';
        document.body.style["user-select"] = "";
    }
    function diff(isX, e, old_e) {
        if (isX) {
            return e.clientX - old_e.clientX;
        }
        else {
            return e.clientY - old_e.clientY;
        }
    }
    /**
     * 只移动
     * @param p
     */
    function dragMoveHelper(p) {
        var laste;
        var move = false;
        var allow = p.allow || function () { return true; };
        var diffPool = [];
        if (p.diff) {
            diffPool.push(function (x, y) {
                p.diff({ x: x, y: y });
            });
        }
        if (p.diffX) {
            diffPool.push(function (x, y) {
                if (x != 0) {
                    p.diffX(x);
                }
            });
        }
        if (p.diffY) {
            diffPool.push(function (x, y) {
                if (y != 0) {
                    p.diffY(y);
                }
            });
        }
        var m = {
            move: function (e) {
                if (allow()) {
                    if (move) {
                        e = e || window.Event;
                        var x = e.clientX - laste.clientX;
                        var y = e.clientY - laste.clientY;
                        for (var _i = 0, diffPool_1 = diffPool; _i < diffPool_1.length; _i++) {
                            var diff_1 = diffPool_1[_i];
                            diff_1(x, y);
                        }
                        laste = e;
                        mb.DOM.stopPropagation(e);
                    }
                }
            },
            cancel: function (e) {
                move = false;
                destroy();
                canSelect();
                if (p.cancel) {
                    p.cancel(e);
                }
            }
        };
        var border = p.border || document;
        function init() {
            mb.DOM.addEvent(border, "mousemove", m.move);
            mb.DOM.addEvent(border, "mouseup", m.cancel);
            mb.DOM.addEvent(border, "mouseleave", m.cancel);
        }
        function destroy() {
            mb.DOM.removeEvent(border, "mousemove", m.move);
            mb.DOM.removeEvent(border, "mouseup", m.cancel);
            mb.DOM.removeEvent(border, "mouseleave", m.cancel);
        }
        return function (e) {
            stopSelect();
            laste = e || window.Event;
            move = true;
            init();
            mb.DOM.stopPropagation(e);
        };
    }
    exports.dragMoveHelper = dragMoveHelper;
    /**
     * 主要是拖拽放大。拖动只是辅助。如果只有拖动，不如另写
     * @param p
     */
    function dragResizeHelper(p) {
        var event = null;
        var allow = p.allow || function () { return true; };
        var m = {
            cancel: function (e) {
                event = null;
                canSelect();
                destroy();
            },
            move: function (e) {
                if (allow()) {
                    var old_e = event.event;
                    e = e || window.event;
                    event.event = e;
                    var x = diff(true, e, old_e);
                    var y = diff(false, e, old_e);
                    if (x != 0) {
                        if (event.dir.l) {
                            p.addLeft(x);
                            p.addWidth(-x);
                        }
                        if (event.dir.r) {
                            p.addWidth(x);
                        }
                    }
                    if (y != 0) {
                        if (event.dir.t) {
                            p.addTop(y);
                            p.addHeight(-y);
                        }
                        if (event.dir.b) {
                            p.addHeight(y);
                        }
                    }
                }
            }
        };
        //最大边界，一般是document
        var border = p.border || document;
        function init() {
            mb.DOM.addEvent(border, "mousemove", m.move);
            mb.DOM.addEvent(border, "mouseup", m.cancel);
            mb.DOM.addEvent(border, "mouseleave", m.cancel);
        }
        function destroy() {
            mb.DOM.removeEvent(border, "mousemove", m.move);
            mb.DOM.removeEvent(border, "mouseup", m.cancel);
            mb.DOM.removeEvent(border, "mouseleave", m.cancel);
        }
        return function (e, dir) {
            stopSelect();
            event = {
                event: e,
                dir: dir
            };
            init();
        };
    }
    exports.dragResizeHelper = dragResizeHelper;
});
