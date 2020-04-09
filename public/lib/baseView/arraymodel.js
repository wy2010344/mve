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
    function valueOf(v, set) {
        var cache = util_1.mve.valueOf(v);
        return function () {
            if (arguments.length == 0) {
                return cache();
            }
            else {
                var v_1 = arguments[0];
                set(v_1);
                cache(v_1);
            }
        };
    }
    var BaseView = /** @class */ (function () {
        function BaseView(view) {
            this.view = view;
            this.x = valueOf(0, function (v) {
                view.setX(v);
            });
            this.y = valueOf(0, function (v) {
                view.setY(v);
            });
            this.w = valueOf(0, function (v) {
                view.setW(v);
            });
            this.h = valueOf(0, function (v) {
                view.setH(v);
            });
        }
        BaseView.prototype.destroy = function () { };
        return BaseView;
    }());
    exports.BaseView = BaseView;
    var SubView = /** @class */ (function (_super) {
        __extends(SubView, _super);
        function SubView() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.index = util_1.mve.valueOf(0);
            return _this;
        }
        return SubView;
    }(BaseView));
    exports.SubView = SubView;
    var SuperView = /** @class */ (function (_super) {
        __extends(SuperView, _super);
        function SuperView() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.count = util_1.mve.valueOf(0);
            _this.children = [];
            return _this;
        }
        SuperView.prototype.size = function () {
            return this.count();
        };
        SuperView.prototype.get = function (index) {
            return this.children[index];
        };
        SuperView.prototype.updateIndex = function (index) {
            for (var i = index; i < this.children.length; i++) {
                this.children[i].index(i);
            }
            this.count(this.children.length);
        };
        SuperView.prototype.insert = function (index, item) {
            this.children.splice(index, 0, item);
            this.view.insert(index, item.view);
            this.updateIndex(index);
        };
        SuperView.prototype.removeAt = function (index) {
            var child = this.children.splice(index, 1)[0];
            if (child) {
                this.view.removeAt(index);
                child.destroy();
                this.updateIndex(index);
            }
            else {
                mb.log("\u53EA\u6709" + this.size() + "\uFF0C\u79FB\u9664" + index + "\u5931\u8D25");
            }
        };
        SuperView.prototype.push = function (item) {
            this.insert(this.size(), item);
        };
        SuperView.prototype.pop = function () {
            this.removeAt(this.size() - 1);
        };
        SuperView.prototype.unshift = function (item) {
            this.insert(0, item);
        };
        SuperView.prototype.shift = function () {
            this.removeAt(0);
        };
        return SuperView;
    }(BaseView));
    exports.SuperView = SuperView;
});
