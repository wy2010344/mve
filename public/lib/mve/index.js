define(["require", "exports", "./childrenBuilder", "./singleModel", "./util"], function (require, exports, childrenBuilder_1, singleModel_1, util_1) {
    "use strict";
    exports.__esModule = true;
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
            /**自己作为返回节点的情况 */
            mve: function (fun) {
                var life = util_1.mve.newLifeModel();
                var uresult = fun(life.me);
                var presult = view(life.me, uresult.element);
                return {
                    out: uresult.out,
                    element: presult.element,
                    init: function () {
                        presult.init();
                        uresult.init();
                    },
                    destroy: function () {
                        uresult.destroy();
                        presult.destroy();
                    }
                };
            },
            /**自己作为多节点的情况 */
            children: childrenBuilder_1.childrenBuilder(view),
            /**自己的子单节点的情况 */
            single: singleModel_1.singleBuilder(view)
        };
    }
    exports.parseOf = parseOf;
});
