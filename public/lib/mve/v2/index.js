define(["require", "exports", "./childrenBuilder", "./singleModel"], function (require, exports, childrenBuilder_1, singleModel_1) {
    "use strict";
    exports.__esModule = true;
    exports.parseUtil = {
        bind: function (me, value, fun) {
            if (typeof (value) == 'function') {
                me.Watch({
                    exp: function () {
                        return value();
                    },
                    after: fun
                });
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
            /**自己作为返回节点的情况 */
            mve: function (fun) {
                var life = mve.lifeModel();
                var result = fun(life.me);
                var rDestroy = result.destroy;
                result.destroy = function () {
                    if (rDestroy) {
                        rDestroy();
                    }
                    life.destroy();
                };
                return result;
            },
            /**自己作为多节点的情况 */
            children: childrenBuilder_1.childrenBuilder(view),
            /**自己的子单节点的情况 */
            single: singleModel_1.singleBuilder(view)
        };
    }
    exports.parseOf = parseOf;
});
