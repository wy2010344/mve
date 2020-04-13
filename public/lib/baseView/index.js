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
    var BAbsView = /** @class */ (function () {
        function BAbsView() {
            this.children = [];
        }
        BAbsView.prototype.setBackground = function (c) {
            this.getElement().style.background = c;
        };
        BAbsView.prototype.kSetX = function (x) {
            this.x = x;
            this.getElement().style.left = x + "px";
        };
        BAbsView.prototype.kSetY = function (y) {
            this.y = y;
            this.getElement().style.top = y + "px";
        };
        BAbsView.prototype.kSetW = function (w) {
            this.w = w;
            this.getElement().style.width = w + "px";
        };
        BAbsView.prototype.kSetH = function (h) {
            this.h = h;
            this.getElement().style.height = h + "px";
        };
        //便利的方法，感觉都不会用
        BAbsView.prototype.kSetCenterX = function (x) {
            this.kSetX(x - (this.w / 2));
        };
        BAbsView.prototype.kSetCenterY = function (y) {
            this.kSetY(y - (this.h / 2));
        };
        BAbsView.prototype.getInnerElement = function () {
            return this.getElement();
        };
        BAbsView.prototype.insert = function (index, view) {
            if (-1 < index && index < (this.children.length + 1)) {
                if (index < this.children.length) {
                    this.getInnerElement().insertBefore(view.getElement(), this.children[index].getElement());
                }
                else {
                    this.getInnerElement().appendChild(view.getElement());
                }
                this.children.splice(index, 0, view);
            }
            else {
                mb.log("\u63D2\u5165\u4F4D\u7F6E\u4E0D\u6B63\u786E\uFF0C\u5168\u957F" + this.children.length + ",\u4F4D\u7F6E" + index);
            }
        };
        BAbsView.prototype.indexOf = function (view) {
            return this.children.indexOf(view);
        };
        BAbsView.prototype.removeAt = function (index) {
            var view = this.children.splice(index, 1)[0];
            if (view) {
                this.getInnerElement().removeChild(view.getElement());
            }
            else {
                mb.log("\u5220\u9664\u4F4D\u7F6E\u4E0D\u6B63\u786E\uFF0C\u5168\u957F" + this.children.length + ",\u4F4D\u7F6E" + index);
            }
        };
        /////////////////
        BAbsView.prototype.push = function (view) {
            this.insert(this.children.length, view);
        };
        BAbsView.prototype.unshift = function (view) {
            this.insert(0, view);
        };
        BAbsView.prototype.pop = function () {
            this.removeAt(this.children.length - 1);
        };
        BAbsView.prototype.shift = function () {
            this.removeAt(0);
        };
        return BAbsView;
    }());
    exports.BAbsView = BAbsView;
    var BLable = /** @class */ (function (_super) {
        __extends(BLable, _super);
        function BLable() {
            var _this = _super.call(this) || this;
            _this.element = document.createElement("div");
            _this.element.style.position = "absolute";
            _this.element.style.textAlign = "center";
            return _this;
        }
        BLable.prototype.getElement = function () { return this.element; };
        BLable.prototype.kSetH = function (h) {
            this.element.style.lineHeight = h + "px";
            _super.prototype.kSetH.call(this, h);
        };
        BLable.prototype.setText = function (txt) {
            //sizeToFit一体了
            this.element.innerText = txt;
        };
        return BLable;
    }(BAbsView));
    exports.BLable = BLable;
    var BButton = /** @class */ (function (_super) {
        __extends(BButton, _super);
        function BButton() {
            var _this = _super.call(this) || this;
            _this.element = document.createElement("div");
            _this.element.style.position = "absolute";
            _this.element.style.cursor = "pointer";
            _this.element.style.textAlign = "center";
            return _this;
        }
        BButton.prototype.getElement = function () { return this.element; };
        BButton.prototype.setText = function (txt) {
            //sizeToFit一体了
            this.element.innerText = txt;
        };
        BButton.prototype.kSetH = function (h) {
            this.element.style.lineHeight = h + "px";
            _super.prototype.kSetH.call(this, h);
        };
        BButton.prototype.setClick = function (click) {
            mb.DOM.addEvent(this.element, "click", click);
        };
        return BButton;
    }(BAbsView));
    exports.BButton = BButton;
    var BInput = /** @class */ (function (_super) {
        __extends(BInput, _super);
        function BInput() {
            var _this = _super.call(this) || this;
            _this.element = document.createElement("input");
            _this.element.style.position = "absolute";
            return _this;
        }
        BInput.prototype.getElement = function () { return this.element; };
        BInput.prototype.getValue = function () {
            return this.element.value;
        };
        return BInput;
    }(BAbsView));
    exports.BInput = BInput;
    var BView = /** @class */ (function (_super) {
        __extends(BView, _super);
        function BView() {
            var _this = _super.call(this) || this;
            _this.element = document.createElement("div");
            _this.element.style.position = "absolute";
            return _this;
        }
        BView.prototype.getElement = function () { return this.element; };
        return BView;
    }(BAbsView));
    exports.BView = BView;
    var BListItem = /** @class */ (function () {
        function BListItem() {
            this.view = new BView();
            this.height = util_1.mve.valueOf(0);
        }
        return BListItem;
    }());
    exports.BListItem = BListItem;
    var BList = /** @class */ (function () {
        function BList(me) {
            this.view = new BView();
            this.children = [];
            this.size = util_1.mve.valueOf(0);
            this.height = util_1.mve.valueOf(0);
            this.split = util_1.mve.valueOf(0);
            this.width = util_1.mve.valueOf(0);
            var that = this;
            //高度监视
            me.WatchAfter(function () {
                var size = that.size();
                var split = that.split();
                var h = 0;
                for (var i = 0; i < that.size(); i++) {
                    var child = that.children[i];
                    child.view.kSetY(h);
                    var ch = child.height();
                    child.view.kSetH(ch);
                    h = h + split + ch;
                }
                if (size > 0) {
                    return h - split;
                }
                else {
                    return h;
                }
            }, function (h) {
                that.view.kSetH(h);
                that.height(h);
            });
            //宽度变化
            me.Watch(function () {
                var w = that.width();
                that.view.kSetW(w);
                var size = that.size();
                for (var i = 0; i < size; i++) {
                    that.children[i].view.kSetW(w);
                }
            });
        }
        BList.prototype.getHeight = function () {
            return this.height();
        };
        BList.prototype.reloadSize = function () {
            this.size(this.children.length);
        };
        BList.prototype.insertBefore = function (e, old) {
            var index = this.children.indexOf(old);
            if (index > -1) {
                this.view.insert(index, e.view);
                this.children.splice(index, 0, e);
                this.reloadSize();
            }
            else {
                mb.log("insert失败");
            }
        };
        BList.prototype.append = function (e) {
            this.view.push(e.view);
            this.children.push(e);
            this.reloadSize();
        };
        BList.prototype.remove = function (e) {
            var index = this.children.indexOf(e);
            if (index > -1) {
                this.view.removeAt(index);
                this.children.splice(index, 1);
                this.reloadSize();
            }
            else {
                mb.log("remove失败");
            }
        };
        return BList;
    }());
    exports.BList = BList;
    var BListVirtualParam = /** @class */ (function () {
        function BListVirtualParam(pel) {
            this.pel = pel;
        }
        BListVirtualParam.prototype.remove = function (e) {
            this.pel.remove(e);
        };
        BListVirtualParam.prototype.append = function (e, isMove) {
            this.pel.append(e);
        };
        BListVirtualParam.prototype.insertBefore = function (e, old, isMove) {
            this.pel.insertBefore(e, old);
        };
        return BListVirtualParam;
    }());
    exports.BListVirtualParam = BListVirtualParam;
});
