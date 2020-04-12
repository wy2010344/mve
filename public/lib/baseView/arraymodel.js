var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "../mve/util"], function (require, exports, util_1) {
    "use strict";
    exports.__esModule = true;
    var BParamImpl = /** @class */ (function () {
        function BParamImpl() {
            this.pool = [];
        }
        BParamImpl.prototype.Watch = function (exp) {
            this.pool.push(util_1.mve.Watch(exp));
        };
        BParamImpl.prototype.WatchExp = function (before, exp, after) {
            this.pool.push(util_1.mve.WatchExp(before, exp, after));
        };
        BParamImpl.prototype.WatchBefore = function (before, exp) {
            this.pool.push(util_1.mve.WatchBefore(before, exp));
        };
        BParamImpl.prototype.WatchAfter = function (exp, after) {
            this.pool.push(util_1.mve.WatchAfter(exp, after));
        };
        BParamImpl.prototype.destroy = function () {
            while (this.pool.length > 0) {
                this.pool.pop().disable();
            }
        };
        return BParamImpl;
    }());
    exports.BParamImpl = BParamImpl;
    var BSubParamImpl = /** @class */ (function (_super) {
        __extends(BSubParamImpl, _super);
        function BSubParamImpl(i) {
            var _this = _super.call(this) || this;
            _this.indexValue = util_1.mve.valueOf(i);
            return _this;
        }
        BSubParamImpl.prototype.index = function () {
            return this.indexValue();
        };
        return BSubParamImpl;
    }(BParamImpl));
    var BSuper = /** @class */ (function () {
        function BSuper(view) {
            this.view = view;
            this.params = [];
            this.children = [];
            this.size = util_1.mve.valueOf(0);
        }
        BSuper.prototype.count = function () {
            return this.size();
        };
        BSuper.prototype.get = function (i) {
            return this.children[i];
        };
        BSuper.prototype.reloadSize = function (i) {
            while (i < this.params.length) {
                this.params[i].indexValue(i);
                i++;
            }
            this.size(this.children.length);
        };
        BSuper.prototype.insert = function (i, get) {
            var param = new BSubParamImpl(i);
            var child = get(param);
            //创建3个
            this.params.splice(i, 0, param);
            this.children.splice(i, 0, child);
            this.view.insert(i, child.view);
            this.reloadSize(i);
        };
        BSuper.prototype.removeAt = function (i) {
            //销毁4个
            this.params.splice(i, 1)[0].destroy();
            this.children.splice(i, 1);
            this.view.removeAt(i);
            this.reloadSize(i);
        };
        BSuper.prototype.moveTo = function (from, to) {
            if (from == to) {
                return;
            }
            var child = this.children.splice(from, 1)[0];
            var param = this.params.splice(from)[0];
            this.view.removeAt(from);
            this.children.splice(to, 0, child);
            this.params.splice(to, 0, param);
            this.view.insert(to, child.view);
            var _a = from < to ? [from, to] : [to, from], min = _a[0], max = _a[1];
            for (var i = min; i <= max; i++) {
                this.params[i].indexValue(i);
            }
            this.size(this.size());
        };
        BSuper.prototype.push = function (get) {
            this.insert(this.count(), get);
        };
        BSuper.prototype.pop = function () {
            this.removeAt(this.count() - 1);
        };
        BSuper.prototype.unshift = function (get) {
            this.insert(0, get);
        };
        BSuper.prototype.shift = function () {
            this.removeAt(0);
        };
        return BSuper;
    }());
    exports.BSuper = BSuper;
});
