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
define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var BAbsView = /** @class */ (function () {
        function BAbsView() {
        }
        BAbsView.prototype.setBackground = function (c) {
            this.getElement().style.background = c;
        };
        BAbsView.prototype.setX = function (x) {
            this.getElement().style.left = x + "px";
        };
        BAbsView.prototype.setY = function (y) {
            this.getElement().style.top = y + "px";
        };
        BAbsView.prototype.setW = function (w) {
            this.getElement().style.width = w + "px";
        };
        BAbsView.prototype.setH = function (h) {
            this.getElement().style.height = h + "px";
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
            return _this;
        }
        BLable.prototype.getElement = function () { return this.element; };
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
            return _this;
        }
        BButton.prototype.getElement = function () { return this.element; };
        BButton.prototype.setText = function (txt) {
            //sizeToFit一体了
            this.element.innerText = txt;
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
            _this.children = [];
            _this.element = document.createElement("div");
            _this.element.style.position = "absolute";
            return _this;
        }
        BView.prototype.getElement = function () { return this.element; };
        BView.prototype.insert = function (index, view) {
            if (-1 < index && index < (this.children.length + 1)) {
                if (index < this.children.length) {
                    this.element.insertBefore(view.getElement(), this.children[index].getElement());
                }
                else {
                    this.element.appendChild(view.getElement());
                }
                this.children.splice(index, 0, view);
            }
            else {
                mb.log("\u63D2\u5165\u4F4D\u7F6E\u4E0D\u6B63\u786E\uFF0C\u5168\u957F" + this.children.length + ",\u4F4D\u7F6E" + index);
            }
        };
        BView.prototype.removeAt = function (index) {
            var view = this.children.splice(index, 1)[0];
            if (view) {
                this.element.removeChild(view.getElement());
            }
            else {
                mb.log("\u5220\u9664\u4F4D\u7F6E\u4E0D\u6B63\u786E\uFF0C\u5168\u957F" + this.children.length + ",\u4F4D\u7F6E" + index);
            }
        };
        /////////////////
        BView.prototype.push = function (view) {
            this.insert(this.children.length, view);
        };
        BView.prototype.unshift = function (view) {
            this.insert(0, view);
        };
        BView.prototype.pop = function () {
            this.removeAt(this.children.length - 1);
        };
        BView.prototype.shift = function () {
            this.removeAt(0);
        };
        return BView;
    }(BAbsView));
    exports.BView = BView;
    var BScrollView = /** @class */ (function (_super) {
        __extends(BScrollView, _super);
        function BScrollView() {
            var _this = _super.call(this) || this;
            _this.children = [];
            _this.inElement = document.createElement("div");
            _this.inElement.style.position = "absolute";
            _this.element = document.createElement("div");
            _this.element.style.position = "absolute";
            _this.element.style.overflow = "auto";
            _this.element.appendChild(_this.inElement);
            return _this;
        }
        BScrollView.prototype.getElement = function () { return this.element; };
        BScrollView.prototype.setIW = function (w) {
            this.inElement.style.width = w + "px";
        };
        BScrollView.prototype.setIH = function (h) {
            this.inElement.style.height = h + "px";
        };
        BScrollView.prototype.insert = function (index, view) {
            if (-1 < index && index < this.children.length + 1) {
                this.children.splice(index, 0, view);
                if (index < this.children.length) {
                    this.element.insertBefore(view.getElement(), this.children[index].getElement());
                }
                else {
                    this.element.appendChild(view.getElement());
                }
            }
            else {
                mb.log("\u63D2\u5165\u4F4D\u7F6E\u4E0D\u6B63\u786E\uFF0C\u5168\u957F" + this.children.length + ",\u4F4D\u7F6E" + index);
            }
        };
        BScrollView.prototype.removeAt = function (index) {
            var view = this.children.splice(index, 1)[0];
            if (view) {
                this.element.removeChild(view.getElement());
            }
            else {
                mb.log("\u5220\u9664\u4F4D\u7F6E\u4E0D\u6B63\u786E\uFF0C\u5168\u957F" + this.children.length + ",\u4F4D\u7F6E" + index);
            }
        };
        /////////////////
        BScrollView.prototype.push = function (view) {
            this.insert(this.children.length, view);
        };
        BScrollView.prototype.unshift = function (view) {
            this.insert(0, view);
        };
        BScrollView.prototype.pop = function () {
            this.removeAt(this.children.length - 1);
        };
        BScrollView.prototype.shift = function () {
            this.removeAt(0);
        };
        return BScrollView;
    }(BAbsView));
    exports.BScrollView = BScrollView;
});
