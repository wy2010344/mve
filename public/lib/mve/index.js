define(["require", "exports", "./util"], function (require, exports, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.buildElement = exports.buildElementOrginal = exports.parseUtil = void 0;
    exports.parseUtil = {
        bind: function (me, value, fun) {
            if (typeof (value) == 'function') {
                if ('after' in value && value.after) {
                    me.WatchAfter(value, function (v) {
                        value.after(v, fun);
                    });
                }
                else {
                    me.WatchAfter(value, fun);
                }
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
    /**原始的组装*/
    function buildElementOrginal(fun) {
        var out = function (n) {
            return function (parent, me) {
                var out = fun(me, n);
                parent.push(out.element);
                return out;
            };
        };
        out.one = fun;
        out.root = function (cal) {
            var life = util_1.mve.newLifeModel();
            return fun(life.me, cal(life.me), life);
        };
        return out;
    }
    exports.buildElementOrginal = buildElementOrginal;
    /**通用的子元素组装 */
    function buildElement(fun) {
        return buildElementOrginal(function (me, n, life) {
            var out = util_1.BuildResultList.init();
            var element = fun(me, n, out);
            if (life) {
                out.push(life);
            }
            return util_1.onceLife(out.getAsOne(element)).out;
        });
    }
    exports.buildElement = buildElement;
});
