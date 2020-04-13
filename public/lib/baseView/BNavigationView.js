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
define(["require", "exports", "./ArrayModel", "../mve/util"], function (require, exports, ArrayModel_1, util_1) {
    "use strict";
    exports.__esModule = true;
    var BNavigationViewSuper = /** @class */ (function (_super) {
        __extends(BNavigationViewSuper, _super);
        function BNavigationViewSuper(me, view) {
            var _this = _super.call(this, view) || this;
            _this.init(me, view);
            ArrayModel_1.subViewSameWidth(me, _this);
            ArrayModel_1.subViewSameHeiht(me, _this);
            return _this;
        }
        BNavigationViewSuper.prototype.redirect = function (get) {
            this.pop();
            this.push(get);
        };
        return BNavigationViewSuper;
    }(ArrayModel_1.BSuper));
    exports.BNavigationViewSuper = BNavigationViewSuper;
    var BStack = /** @class */ (function (_super) {
        __extends(BStack, _super);
        function BStack(me, view) {
            var _this = _super.call(this, view) || this;
            _this.width = util_1.mve.valueOf(0);
            _this.height = util_1.mve.valueOf(0);
            _this.init(me, view);
            ArrayModel_1.subViewSameWidth(me, _this);
            ArrayModel_1.subViewSameHeiht(me, _this);
            return _this;
        }
        BStack.prototype.getWidth = function () {
            return this.width();
        };
        BStack.prototype.getHeight = function () {
            return this.height();
        };
        return BStack;
    }(ArrayModel_1.BSuper));
    exports.BStack = BStack;
});
