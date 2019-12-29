define(["require", "exports"], function (require, exports) {
    "use strict";
    return {
        build: function (e, repeat, mve, getO) {
            return function (row, i) {
                var o = getO(row, i);
                var obj = mve(function (me) {
                    /*相当于修饰*/
                    return repeat(me, o.data, o.index);
                })(e);
                return {
                    row: o,
                    obj: obj
                };
            };
        },
        getInit: function (view) {
            return view.obj.init;
        },
        init: function (view) {
            view.obj.init();
        },
        destroy: function (view) {
            view.obj.destroy();
        }
    };
});
