define(["require", "exports", "../mve-DOM/other/drag", "../mve/util"], function (require, exports, drag_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.split_two_v = void 0;
    function split_two_v(me, p) {
        var v_height = p.split_height || 10;
        var init = p.init || 1 / 2;
        var top_height = util_1.mve.valueOf((p.height() - v_height) * init);
        var bottom_height = me.Cache(function () {
            return p.height() - top_height() - v_height;
        });
        var render_object = p.render(me, {
            top_height: top_height,
            bottom_height: bottom_height
        });
        render_object.top.style = render_object.top.style || {};
        mb.Object.ember(render_object.top.style, {
            height: function () {
                return top_height() + "px";
            },
            width: function () {
                return p.width() + "px";
            },
            position: "absolute",
            left: "0px",
            top: "0px",
            overflow: "auto"
        });
        render_object.bottom.style = render_object.bottom.style || {};
        mb.Object.ember(render_object.bottom.style, {
            height: function () {
                return bottom_height() + "px";
            },
            width: function () {
                return p.width() + "px";
            },
            position: "absolute",
            overflow: "auto",
            left: "0px",
            bottom: "0px"
        });
        var dragMove = drag_1.dragMoveHelper({
            diff: function (p) {
                var y = p.y;
                if (y != 0) {
                    top_height(top_height() + y);
                }
            }
        });
        return {
            type: "div",
            init: render_object.init,
            destroy: render_object.destroy,
            style: {
                width: function () {
                    return p.width() + "px";
                },
                height: function () {
                    return p.height() + "px";
                },
                position: "relative"
            },
            children: [
                render_object.top,
                {
                    type: "div",
                    style: {
                        width: function () {
                            return p.width() + "px";
                        },
                        background: "gray",
                        height: (v_height - 2) + "px",
                        left: "0px",
                        margin: "1px 0",
                        top: function () {
                            return top_height() + "px";
                        },
                        cursor: "s-resize",
                        position: "absolute"
                    },
                    action: {
                        mousedown: dragMove
                    }
                },
                render_object.bottom
            ]
        };
    }
    exports.split_two_v = split_two_v;
});
