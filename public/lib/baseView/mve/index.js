define(["require", "exports", "./childrenBuilder"], function (require, exports, childrenBuilder_1) {
    "use strict";
    exports.__esModule = true;
    exports.parseOf = exports.parseUtil = void 0;
    exports.parseUtil = {
        bind: function (me, value, fun) {
            if (typeof (value) == 'function') {
                me.WatchAfter(function () {
                    return value();
                }, fun);
            }
            else {
                fun(value);
            }
        },
        bindKV: function (me, map, fun) {
            mb.Object.forEach(map, function (v, k) {
                exports.parseUtil.bind(me, map[k], function (v) {
                    fun(k, v);
                });
            });
        }
    };
    function parseOf(view) {
        return {
            view: view,
            children: childrenBuilder_1.childrenBuilder(view)
        };
    }
    exports.parseOf = parseOf;
});
