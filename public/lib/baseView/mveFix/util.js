define(["require", "exports", "../mve/index"], function (require, exports, index_1) {
    "use strict";
    exports.__esModule = true;
    function buildAbs(me, e, child) {
        if (child.x) {
            index_1.parseUtil.bind(me, child.x, function (v) {
                e.kSetX(v);
            });
        }
        if (child.y) {
            index_1.parseUtil.bind(me, child.y, function (v) {
                e.kSetY(v);
            });
        }
        index_1.parseUtil.bind(me, child.w, function (v) {
            e.kSetW(v);
        });
        index_1.parseUtil.bind(me, child.h, function (v) {
            e.kSetH(v);
        });
        if (child.background) {
            index_1.parseUtil.bind(me, child.background, function (v) {
                e.setBackground(v);
            });
        }
    }
    exports.buildAbs = buildAbs;
    var BViewVirtualParam = /** @class */ (function () {
        function BViewVirtualParam(pel) {
            this.pel = pel;
        }
        BViewVirtualParam.prototype.remove = function (e) {
            var index = this.pel.indexOf(e);
            if (index > -1) {
                this.pel.removeAt(index);
            }
            else {
                mb.log("remove失败");
            }
        };
        BViewVirtualParam.prototype.append = function (e, isMove) {
            this.pel.push(e);
        };
        BViewVirtualParam.prototype.insertBefore = function (e, old, isMove) {
            var index = this.pel.indexOf(e);
            if (index > -1) {
                this.pel.insert(index, e);
            }
            else {
                mb.log("insertBefore失败");
            }
        };
        return BViewVirtualParam;
    }());
    exports.BViewVirtualParam = BViewVirtualParam;
    var BArrayVirtualParam = /** @class */ (function () {
        function BArrayVirtualParam(pel) {
            this.pel = pel;
        }
        BArrayVirtualParam.prototype.remove = function (e) {
            var index = this.pel.indexOf(e);
            if (index > -1) {
                this.pel.removeAt(index);
            }
            else {
                mb.log("remove失败");
            }
        };
        BArrayVirtualParam.prototype.append = function (e, isMove) {
            this.pel.push(e);
        };
        BArrayVirtualParam.prototype.insertBefore = function (e, old, isMove) {
            var index = this.pel.indexOf(old);
            if (index > -1) {
                this.pel.insert(index, e);
            }
            else {
                mb.log("insertBefore失败");
            }
        };
        return BArrayVirtualParam;
    }());
    exports.BArrayVirtualParam = BArrayVirtualParam;
});
