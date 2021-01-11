define(["require", "exports", "./util", "./childrenBuilder", "./singleModel"], function (require, exports, util_1, childrenBuilder_1, singleModel_1) {
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
                exports.parseUtil.bind(me, v, function (value) {
                    fun(k, value);
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
                var vr = view(life.me, fun(life.me));
                var destroy = vr.destroy;
                vr.destroy = function () {
                    util_1.orRun(destroy);
                    life.destroy();
                };
                return vr;
            },
            /**自己作为多节点的情况 */
            children: childrenBuilder_1.childrenBuilder(view),
            /**自己的子单节点的情况 */
            single: singleModel_1.singleBuilder(view)
        };
    }
    exports.parseOf = parseOf;
});
