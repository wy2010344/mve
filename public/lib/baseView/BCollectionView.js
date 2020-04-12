define(["require", "exports", "./ArrayModel", "../mve/util"], function (require, exports, ArrayModel_1, util_1) {
    "use strict";
    exports.__esModule = true;
    function collectionOf(me, p) {
        var superArray = new ArrayModel_1.BSuper(p.view);
        var height = util_1.mve.valueOf(0);
        me.WatchAfter(function () {
            var size = superArray.count();
            var cw = p.cellWidth();
            var ch = p.cellHeight();
            var cc = p.columnCount() > 0 ? p.columnCount() : 1;
            var i = 0;
            var col = 0, row = 0;
            while (i < size) {
                var child = superArray.get(i);
                col = i % cc;
                row = i / cc;
                child.view.setX(col * cw);
                child.view.setY(row * ch);
                i++;
            }
            return row;
        }, function (row) {
            height((row + 1) * p.cellHeight());
        });
        var it = {
            width: function () {
                return p.cellWidth() * p.columnCount();
            },
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
        me.Watch(function () {
            p.view.setW(it.width());
        });
        me.Watch(function () {
            p.view.setH(it.height());
        });
        return it;
    }
    exports.collectionOf = collectionOf;
});
