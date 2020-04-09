define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    /**
     * 宽度相同
     * @param me
     * @param model
     */
    function sameWidth(me, model) {
        //宽度相同
        me.WatchAfter(function () {
            return [model.w(), model.size()];
        }, function (_a) {
            var w = _a[0], count = _a[1];
            var i = 0;
            while (i < count) {
                model.get(i).w(w);
                i++;
            }
        });
    }
    exports.sameWidth = sameWidth;
    /**
     * 高度相同
     * @param me
     * @param model
     */
    function sameHeight(me, model) {
        me.WatchAfter(function () {
            return [model.h(), model.size()];
        }, function (_a) {
            var h = _a[0], count = _a[1];
            var i = 0;
            while (i < count) {
                model.get(i).h(h);
                i++;
            }
        });
    }
    exports.sameHeight = sameHeight;
    /**
     * 所有子节点X方向上居中对齐
     * @param me
     * @param model
     */
    function centerX(me, model) {
        me.WatchAfter(function () {
            var ws = [];
            var w = model.w();
            var index = 0;
            while (index < model.size()) {
                ws.push(model.get(index).w());
                index++;
            }
            return [ws, w];
        }, function (_a) {
            var ws = _a[0], w = _a[1];
            var index = 0;
            while (index < model.size()) {
                model.get(index).x((w - ws[index]) / 2);
            }
        });
    }
    exports.centerX = centerX;
    /**
     * 所有子节点Y方向上居中对齐
     * @param me
     * @param model
     */
    function centerY(me, model) {
        me.WatchAfter(function () {
            var hs = [];
            var h = model.h();
            var index = 0;
            while (index < model.size()) {
                hs.push(model.get(index).h());
                index++;
            }
            return [hs, h];
        }, function (_a) {
            var hs = _a[0], h = _a[1];
            var index = 0;
            while (index < model.size()) {
                model.get(index).y((h - hs[index]) / 2);
            }
        });
    }
    exports.centerY = centerY;
    /**
     * 固定分割的行增长
     * @param me
     * @param model
     * @param arg
     * @param setHeight
     */
    function hListSplit(me, model, arg, setHeight) {
        me.WatchAfter(function () {
            var index = 0;
            var h = arg.begin;
            var hs = [];
            while (index < model.size()) {
                var child = model.get(index);
                hs.push(h);
                h = h + arg.split + child.h();
                index++;
            }
            h = h + arg.end;
            return [hs, h];
        }, function (_a) {
            var hs = _a[0], h = _a[1];
            var index = 0;
            while (index < model.size()) {
                var child = model.get(index);
                child.y(hs[index]);
                index++;
            }
            setHeight(h);
        });
    }
    exports.hListSplit = hListSplit;
    /**
     * 其它使用场景
     * 均匀分布，但子视图根据父视图比例生长。按自己的比例，按相等的宽度。
     * 等用到的时候再来抽象吧
     */
    function hListAverge(me, model) {
    }
    exports.hListAverge = hListAverge;
    /**
     * 宽度方向增长并换行
     */
    function wrcollect(me, model) {
    }
    exports.wrcollect = wrcollect;
});
