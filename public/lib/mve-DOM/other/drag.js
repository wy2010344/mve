define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var stopSelect = function () {
        document.body.style["user-select"] = "none";
    };
    var canSelect = function () {
        document.body.style["user-select"] = "";
    };
    var diff = function (isX, e, old_e) {
        if (isX) {
            return e.clientX - old_e.clientX;
        }
        else {
            return e.clientY - old_e.clientY;
        }
    };
    function dragHelper(p) {
        var event = {
            type: ""
        };
        var m = {
            mouseup: function (e) {
                event.type = "";
                canSelect();
            },
            mouseleave: function (e) {
                event.type = "";
                canSelect();
            },
            mousemove: function (e) {
                if (p.show()) {
                    //当前是最前
                    if (!p.max()) {
                        //非最大
                        if (event.type == "resize") {
                            var old_e = event.event;
                            e = e || window.event;
                            event.event = e;
                            if (event.dir.l) {
                                var x = diff(true, e, old_e);
                                p.left(p.left() + x);
                                p.width(p.width() - x);
                            }
                            if (event.dir.r) {
                                var x = diff(true, e, old_e);
                                p.width(p.width() + x);
                            }
                            if (event.dir.t) {
                                var y = diff(false, e, old_e);
                                p.top(p.top() + y);
                                p.height(p.height() - y);
                            }
                            if (event.dir.b) {
                                var y = diff(false, e, old_e);
                                p.height(p.height() + y);
                            }
                        }
                        else if (event.type == "move") {
                            var old_e = event.event;
                            e = e || window.event;
                            event.event = e;
                            var x = diff(true, e, old_e);
                            var y = diff(false, e, old_e);
                            p.left(p.left() + x);
                            p.top(p.top() + y);
                        }
                    }
                }
            }
        };
        return {
            resize: function (e, dir) {
                stopSelect();
                event = {
                    type: "resize",
                    event: e,
                    dir: dir
                };
            },
            move: function (e) {
                stopSelect();
                event = {
                    type: "move",
                    event: e
                };
            },
            init: function () {
                mb.DOM.addEvent(document, "mousemove", m.mousemove);
                mb.DOM.addEvent(document, "mouseup", m.mouseup);
                mb.DOM.addEvent(document, "mouseleave", m.mouseleave);
            },
            destroy: function () {
                mb.DOM.removeEvent(document, "mousemove", m.mousemove);
                mb.DOM.removeEvent(document, "mouseup", m.mouseup);
                mb.DOM.removeEvent(document, "mouseleave", m.mouseleave);
            }
        };
    }
    exports.dragHelper = dragHelper;
});
