define(["require", "exports", "../mve/util"], function (require, exports, util_1) {
    "use strict";
    exports.__esModule = true;
    var MveUtil = /** @class */ (function () {
        function MveUtil() {
            this.pool = [];
        }
        MveUtil.prototype.Watch = function (exp) {
            this.pool.push(util_1.mve.Watch(exp));
        };
        MveUtil.prototype.WatchExp = function (before, exp, after) {
            this.pool.push(util_1.mve.WatchExp(before, exp, after));
        };
        MveUtil.prototype.WatchBefore = function (before, exp) {
            this.pool.push(util_1.mve.WatchBefore(before, exp));
        };
        MveUtil.prototype.WatchAfter = function (exp, after) {
            this.pool.push(util_1.mve.WatchAfter(exp, after));
        };
        MveUtil.prototype.destroy = function () {
            while (this.pool.length > 0) {
                this.pool.pop().disable();
            }
        };
        return MveUtil;
    }());
    exports.MveUtil = MveUtil;
});
