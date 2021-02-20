/**
 * 可以进一步简化，依赖外部的mve。
 * left的right都可以用div，可以控制overflow等属性。
 * render里的init和destroy都可以不要，直接依附于父环境的。
 * 但如果子环境生成init和destroy，但父环境没有适当的接口，就必须用mve来处理？
 *
 * 像split一样改造，全局的拖动事件
 * @param p
 */
define(["require", "exports", "../mve-DOM/other/drag", "../mve/util"], function (require, exports, drag_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.split_two_h = void 0;
    function split_two_h(me, p) {
        var h_width = p.split_width || 10;
        var init = p.init || 1 / 2;
        var left_width = util_1.mve.valueOf((p.width() - h_width) * init);
        var right_width = me.Cache(function () {
            return p.width() - left_width() - h_width;
        });
        var render_object = p.render(me, {
            left_width: left_width,
            right_width: right_width
        });
        render_object.right.style = render_object.right.style || {};
        mb.Object.ember(render_object.right.style, {
            height: function () {
                return p.height() + "px";
            },
            width: function () {
                return right_width() + "px";
            },
            position: "absolute",
            overflow: "auto",
            right: "0px",
            top: "0px"
        });
        render_object.left.style = render_object.left.style || {};
        mb.Object.ember(render_object.left.style, {
            height: function () {
                return p.height() + "px";
            },
            width: function () {
                return left_width() + "px";
            },
            position: "absolute",
            left: "0px",
            top: "0px",
            overflow: "auto"
        });
        var dragMove = drag_1.dragMoveHelper({
            diff: function (p) {
                var x = p.x;
                if (x != 0) {
                    left_width(left_width() + x);
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
                render_object.left,
                {
                    type: "div",
                    style: {
                        height: function () {
                            return p.height() + "px";
                        },
                        background: "gray",
                        width: (h_width - 2) + "px",
                        top: "0px",
                        margin: "0 1px",
                        left: function () {
                            return left_width() + "px";
                        },
                        cursor: "w-resize",
                        position: "absolute"
                    },
                    action: {
                        mousedown: dragMove
                    }
                },
                render_object.right
            ]
        };
    }
    exports.split_two_h = split_two_h;
});
