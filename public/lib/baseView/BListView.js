define(["require", "exports", "./ArrayModel", "../mve/util"], function (require, exports, ArrayModel_1, util_1) {
    "use strict";
    exports.__esModule = true;
    //对应widenList，变宽
    function increaseListOf(me, p) {
        me.Watch(function () {
            p.view.setW(p.width());
        });
        var superArray = new ArrayModel_1.BSuper(p.view);
        var height = util_1.mve.valueOf(0);
        me.WatchAfter(function () {
            var h = 0;
            var i = 0;
            while (i < superArray.count()) {
                var child = superArray.get(i);
                var ch = child.height();
                child.view.setY(h);
                child.view.setH(ch);
                h = h + ch;
                i++;
            }
            return h;
        }, function (h) {
            height(h);
        });
        var it = {
            width: p.width,
            height: function () {
                return height();
            },
            insert: function (index, get) {
                superArray.insert(index, get);
            },
            removeAt: function (index) {
                superArray.removeAt(index);
            }
        };
        return it;
    }
    exports.increaseListOf = increaseListOf;
    function scrollListOf(mve, p) {
        mve.Watch(function () {
            p.view.setW(p.width());
            p.view.setIW(p.width());
        });
        mve.Watch(function () {
            p.view.setH(p.height());
        });
        var superArray = new ArrayModel_1.BSuper(p.view);
        mve.Watch(function () {
            var h = 0;
            var i = 0;
            while (i < superArray.count()) {
                var child = superArray.get(i);
                var ch = child.height();
                child.view.setY(h);
                child.view.setH(ch);
                h = h + ch;
                i++;
            }
            p.view.setIH(h);
        });
        var it = {
            width: p.width,
            height: p.height,
            insert: function (index, get) {
                superArray.insert(index, get);
            },
            removeAt: function (index) {
                superArray.removeAt(index);
            }
        };
        return it;
    }
    exports.scrollListOf = scrollListOf;
});
