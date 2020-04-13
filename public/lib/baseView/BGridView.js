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
    var BExpandGridViewSuperT = /** @class */ (function (_super) {
        __extends(BExpandGridViewSuperT, _super);
        function BExpandGridViewSuperT(me, view) {
            var _this = _super.call(this, view) || this;
            _this.allHeight = util_1.mve.valueOf(0);
            _this.init(me, view);
            var that = _this;
            me.WatchAfter(function () {
                var size = that.size();
                var cw = that.cellWidth();
                var ch = that.cellHeight();
                var cc = that.columnCount() > 0 ? that.columnCount() : 1;
                var i = 0;
                var col = 0, row = 0;
                while (i < size) {
                    var child = that.get(i);
                    col = i % cc;
                    row = i / cc;
                    child.view.kSetX(col * cw);
                    child.view.kSetY(row * ch);
                    i = i + 1;
                }
                return (row + 1) * ch;
            }, function (h) {
                that.allHeight(h);
            });
            me.Watch(function () {
                var cw = that.cellWidth();
                var size = that.size();
                var i = 0;
                while (i < size) {
                    that.get(i).view.kSetW(cw);
                    i = i + 1;
                }
            });
            me.Watch(function () {
                var ch = that.cellHeight();
                var size = that.size();
                var i = 0;
                while (i < size) {
                    that.get(i).view.kSetH(ch);
                    i = i + 1;
                }
            });
            return _this;
        }
        BExpandGridViewSuperT.prototype.getHeight = function () {
            return this.allHeight();
        };
        BExpandGridViewSuperT.prototype.getWidth = function () {
            return this.cellWidth() * this.columnCount();
        };
        BExpandGridViewSuperT.prototype.cellWidth = function () {
            return 0;
        };
        BExpandGridViewSuperT.prototype.cellHeight = function () {
            return 0;
        };
        BExpandGridViewSuperT.prototype.columnCount = function () {
            return 1;
        };
        return BExpandGridViewSuperT;
    }(ArrayModel_1.BSuper));
    exports.BExpandGridViewSuperT = BExpandGridViewSuperT;
});
