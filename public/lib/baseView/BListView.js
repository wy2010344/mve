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
define(["require", "exports", "./ArrayModel", "./index", "../mve/util"], function (require, exports, ArrayModel_1, index_1, util_1) {
    "use strict";
    exports.__esModule = true;
    var BListViewSub = /** @class */ (function (_super) {
        __extends(BListViewSub, _super);
        function BListViewSub() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        BListViewSub.prototype.getHeight = function () {
            return 44;
        };
        return BListViewSub;
    }(ArrayModel_1.BSub));
    exports.BListViewSub = BListViewSub;
    var BIncreaseListViewSuperT = /** @class */ (function (_super) {
        __extends(BIncreaseListViewSuperT, _super);
        function BIncreaseListViewSuperT(me, view) {
            var _this = _super.call(this, view) || this;
            _this.height = util_1.mve.valueOf(0);
            _this.init(me, view);
            var that = _this;
            me.WatchAfter(function () {
                var h = 0;
                var sh = that.getSplitHeight();
                var index = 0;
                var size = that.size();
                while (index < size) {
                    var child = that.get(index);
                    child.view.kSetY(h);
                    var ch = child.getHeight();
                    child.view.kSetH(ch);
                    h = h + sh + ch;
                    index = index + 1;
                }
                if (size > 0) {
                    return h - sh;
                }
                else {
                    return h;
                }
            }, function (h) {
                that.height(h);
            });
            ArrayModel_1.subViewSameWidth(me, _this);
            return _this;
        }
        BIncreaseListViewSuperT.prototype.getHeight = function () {
            return this.height();
        };
        BIncreaseListViewSuperT.prototype.getSplitHeight = function () {
            return 0;
        };
        return BIncreaseListViewSuperT;
    }(ArrayModel_1.BSuper));
    exports.BIncreaseListViewSuperT = BIncreaseListViewSuperT;
    var BScrollListViewSuperT = /** @class */ (function (_super) {
        __extends(BScrollListViewSuperT, _super);
        function BScrollListViewSuperT(me, view) {
            var _this = _super.call(this, view) || this;
            _this.height = util_1.mve.valueOf(0);
            _this.scrollHeight = util_1.mve.valueOf(0);
            _this.contentView = new index_1.BView();
            view.push(_this.contentView);
            _this.init(me, _this.contentView);
            var that = _this;
            me.WatchAfter(function () {
                var h = 0;
                var sh = that.getSplitHeight();
                var index = 0;
                var size = that.size();
                while (index < size) {
                    var child = that.get(index);
                    child.view.kSetY(h);
                    var ch = child.getHeight();
                    child.view.kSetH(ch);
                    h = h + sh + ch;
                    index = index + 1;
                }
                if (size > 0) {
                    return h - sh;
                }
                else {
                    return h;
                }
            }, function (h) {
                that.height(h);
            });
            me.Watch(function () {
                that.contentView.kSetW(that.getWidth());
            });
            ArrayModel_1.subViewSameWidth(me, _this);
            return _this;
        }
        BScrollListViewSuperT.prototype.getSplitHeight = function () {
            return 0;
        };
        BScrollListViewSuperT.prototype.getScrollHeight = function () {
            return this.scrollHeight();
        };
        return BScrollListViewSuperT;
    }(ArrayModel_1.BSuper));
    exports.BScrollListViewSuperT = BScrollListViewSuperT;
});
