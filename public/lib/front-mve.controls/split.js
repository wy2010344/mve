define(["require", "exports", "../mve-DOM/other/drag", "../mve/util"], function (require, exports, drag_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.split = void 0;
    /**
     * 对比表头的拖动。
     * 表头只是有上下居中。但目前有了确定的点位（不用表格）
     * 文字上下居中，使用line-height
     * @param p
     */
    function split(me, p) {
        var h_width = p.splitWidth || 10;
        var per_width = (p.width() - ((p.children.length - 1) * h_width)) / p.children.length; /*每一格宽度*/
        function calLeft(i) {
            var w = 0;
            for (var x = 0; x < i; x++) {
                w = w + part_width[x]() + h_width;
            }
            return w;
        }
        ;
        function Hill(i) {
            return {
                type: "div",
                style: {
                    height: function () {
                        return p.height() + "px";
                    },
                    background: "gray",
                    width: (h_width - 2) + "px",
                    margin: "0 2px",
                    top: "0px",
                    left: function () {
                        return calLeft(i + 1) - h_width + "px";
                    },
                    cursor: "w-resize",
                    position: "absolute"
                },
                event: {
                    mousedown: function (e) {
                        move_index = i;
                        dragMove(e);
                    }
                }
            };
        }
        ;
        var part_width = [];
        for (var i = 0; i < p.children.length; i++) {
            var width = p.children[i].width || util_1.mve.valueOf(per_width);
            if (width() == 0) {
                width(per_width);
            }
            part_width.push(width);
        }
        var old_w = p.width();
        me.WatchAfter(function () {
            return p.width();
        }, function (w) {
            var px = (w - old_w) / part_width.length;
            mb.Array.forEach(part_width, function (pw) {
                pw(pw() + px);
            });
            old_w = w;
        });
        function Part(i) {
            var child = p.children[i].element;
            child.style = child.style || {};
            child.style.height = function () {
                return p.height() + "px";
            };
            child.style.width = function () {
                return part_width[i]() + "px";
            };
            child.style.position = "absolute";
            child.style.left = function () {
                return calLeft(i) + "px";
            };
            child.style.top = "0px";
            child.style.overflow = "auto";
            return child;
        }
        ;
        var move_index = 0; /*移动的序号*/
        var children = [];
        for (var i = 0; i < p.children.length - 1; i++) {
            children.push(Part(i));
            children.push(Hill(i));
        }
        children.push(Part(p.children.length - 1));
        var dragMove = drag_1.dragMoveHelper({
            diff: function (p) {
                var x = p.x;
                if (x != 0) {
                    var pl = part_width[move_index];
                    var pr = part_width[move_index + 1];
                    pl(pl() + x);
                    pr(pr() - x);
                }
            }
        });
        return {
            type: "div",
            style: {
                position: "relative",
                height: function () {
                    return p.height() + "px";
                }
            },
            children: children
        };
    }
    exports.split = split;
});
