var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
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
    exports.BStackVirtualParam = exports.BStack = exports.BStackItem = exports.BGridVirtualParam = exports.BGrid = exports.BGridItem = exports.BScrollListVirtualParam = exports.BScrollList = exports.BListVirtualParam = exports.BList = exports.BListItem = exports.BView = exports.BInput = exports.BButton = exports.BLable = exports.BAbsView = exports.BParamImpl = void 0;
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
    var BAbsView = /** @class */ (function () {
        function BAbsView() {
            this.children = [];
        }
        BAbsView.prototype.setBackground = function (c) {
            this.getElement().style.background = c;
        };
        BAbsView.prototype.percentOfW = function (x) {
            return x * BAbsView.screenW() / 100;
        };
        /**
         * 依高度的百分比(100)，转成依宽度的百分比
         * @param percentH
         */
        BAbsView.transH = function (percentH) {
            return percentH * BAbsView.screenH() / BAbsView.screenW();
        };
        BAbsView.prototype.rewidth = function () {
            this.kSetH(this.h);
            this.kSetW(this.w);
            this.kSetX(this.x);
            this.kSetY(this.y);
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].rewidth();
            }
        };
        BAbsView.prototype.kSetX = function (x) {
            this.x = x;
            this.getElement().style.left = this.percentOfW(x) + "px";
        };
        BAbsView.prototype.kSetY = function (y) {
            this.y = y;
            this.getElement().style.top = this.percentOfW(y) + "px";
        };
        BAbsView.prototype.kSetW = function (w) {
            this.w = w;
            this.getElement().style.width = this.percentOfW(w) + "px";
        };
        BAbsView.prototype.kSetH = function (h) {
            this.h = h;
            this.getElement().style.height = this.percentOfW(h) + "px";
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
        BAbsView.screenW = util_1.mve.valueOf(window.screen.availWidth);
        BAbsView.screenH = util_1.mve.valueOf(window.screen.availHeight);
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
    var BScrollList = /** @class */ (function () {
        function BScrollList(me) {
            this.outView = new BView();
            this.view = new BView();
            this.children = [];
            this.size = util_1.mve.valueOf(0);
            this.split = util_1.mve.valueOf(0);
            this.height = util_1.mve.valueOf(0);
            this.width = util_1.mve.valueOf(0);
            this.outView.push(this.view);
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
            });
            //宽度变化
            me.Watch(function () {
                var w = that.width();
                that.view.kSetW(w);
                that.outView.kSetW(w);
                var size = that.size();
                for (var i = 0; i < size; i++) {
                    that.children[i].view.kSetW(w);
                }
            });
            me.Watch(function () {
                var h = that.height();
                that.outView.kSetH(h);
            });
        }
        BScrollList.prototype.getInnerHeight = function () {
            return this.height();
        };
        BScrollList.prototype.reloadSize = function () {
            this.size(this.children.length);
        };
        BScrollList.prototype.insertBefore = function (e, old) {
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
        BScrollList.prototype.append = function (e) {
            this.view.push(e.view);
            this.children.push(e);
            this.reloadSize();
        };
        BScrollList.prototype.remove = function (e) {
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
        return BScrollList;
    }());
    exports.BScrollList = BScrollList;
    var BScrollListVirtualParam = /** @class */ (function () {
        function BScrollListVirtualParam(pel) {
            this.pel = pel;
        }
        BScrollListVirtualParam.prototype.remove = function (e) {
            this.pel.remove(e);
        };
        BScrollListVirtualParam.prototype.append = function (e, isMove) {
            this.pel.append(e);
        };
        BScrollListVirtualParam.prototype.insertBefore = function (e, old, isMove) {
            this.pel.insertBefore(e, old);
        };
        return BScrollListVirtualParam;
    }());
    exports.BScrollListVirtualParam = BScrollListVirtualParam;
    var BGridItem = /** @class */ (function () {
        function BGridItem() {
            this.view = new BView();
        }
        return BGridItem;
    }());
    exports.BGridItem = BGridItem;
    var BGrid = /** @class */ (function () {
        function BGrid(me) {
            this.cellWidth = util_1.mve.valueOf(0);
            this.cellHeight = util_1.mve.valueOf(0);
            this.columnNum = util_1.mve.valueOf(1);
            this.width = util_1.mve.valueOf(0);
            this.height = util_1.mve.valueOf(0);
            this.view = new BView();
            this.children = [];
            this.size = util_1.mve.valueOf(0);
            var that = this;
            //高度监视
            me.WatchAfter(function () {
                var size = that.size();
                var cw = that.cellWidth();
                var ch = that.cellHeight();
                var cc = that.columnNum() > 0 ? that.columnNum() : 1;
                var i = 0;
                var col = 0;
                var row = 0;
                while (i < size) {
                    var child = that.children[i];
                    col = i % cc;
                    row = i % cc;
                    child.view.kSetX(col * cw);
                    child.view.kSetY(col * ch);
                    i = i + 1;
                }
                return (row + 1) * ch;
            }, function (h) {
                that.view.kSetH(h);
                that.height(h);
            });
            //宽度变化
            me.Watch(function () {
                var w = that.width();
                that.view.kSetW(w);
            });
            //子视图高度相同
            me.Watch(function () {
                var ch = that.cellHeight();
                var size = that.size();
                var i = 0;
                while (i < size) {
                    var child = that.children[i];
                    child.view.kSetH(ch);
                    i = i + 1;
                }
            });
            //子视图宽度相同
            me.Watch(function () {
                var cw = that.cellWidth();
                var size = that.size();
                var i = 0;
                while (i < size) {
                    var child = that.children[i];
                    child.view.kSetW(cw);
                    i = i + 1;
                }
            });
        }
        BGrid.prototype.getWidth = function () {
            return this.width();
        };
        BGrid.prototype.getHeight = function () {
            return this.height();
        };
        BGrid.prototype.reloadSize = function () {
            this.size(this.children.length);
        };
        BGrid.prototype.insertBefore = function (e, old) {
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
        BGrid.prototype.append = function (e) {
            this.view.push(e.view);
            this.children.push(e);
            this.reloadSize();
        };
        BGrid.prototype.remove = function (e) {
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
        return BGrid;
    }());
    exports.BGrid = BGrid;
    var BGridVirtualParam = /** @class */ (function () {
        function BGridVirtualParam(pel) {
            this.pel = pel;
        }
        BGridVirtualParam.prototype.remove = function (e) {
            this.pel.remove(e);
        };
        BGridVirtualParam.prototype.append = function (e, isMove) {
            this.pel.append(e);
        };
        BGridVirtualParam.prototype.insertBefore = function (e, old, isMove) {
            this.pel.insertBefore(e, old);
        };
        return BGridVirtualParam;
    }());
    exports.BGridVirtualParam = BGridVirtualParam;
    var BStackItem = /** @class */ (function () {
        function BStackItem() {
            this.view = new BView();
        }
        return BStackItem;
    }());
    exports.BStackItem = BStackItem;
    var BStack = /** @class */ (function () {
        function BStack(me) {
            this.width = util_1.mve.valueOf(0);
            this.height = util_1.mve.valueOf(0);
            this.view = new BView();
            this.children = [];
            this.size = util_1.mve.valueOf(0);
            var that = this;
            me.Watch(function () {
                var w = that.width();
                that.view.kSetW(w);
                var size = that.size();
                var i = 0;
                while (i < size) {
                    that.children[i].view.kSetW(w);
                    i = i + 1;
                }
            });
            me.Watch(function () {
                var h = that.height();
                that.view.kSetH(h);
                var size = that.size();
                var i = 0;
                while (i < size) {
                    that.children[i].view.kSetH(h);
                    i = i + 1;
                }
            });
        }
        BStack.prototype.reloadSize = function () {
            this.size(this.children.length);
        };
        BStack.prototype.insertBefore = function (e, old) {
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
        BStack.prototype.append = function (e) {
            this.view.push(e.view);
            this.children.push(e);
            this.reloadSize();
        };
        BStack.prototype.remove = function (e) {
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
        return BStack;
    }());
    exports.BStack = BStack;
    var BStackVirtualParam = /** @class */ (function () {
        function BStackVirtualParam(pel) {
            this.pel = pel;
        }
        BStackVirtualParam.prototype.remove = function (e) {
            this.pel.remove(e);
        };
        BStackVirtualParam.prototype.append = function (e, isMove) {
            this.pel.append(e);
        };
        BStackVirtualParam.prototype.insertBefore = function (e, old, isMove) {
            this.pel.insertBefore(e, old);
        };
        return BStackVirtualParam;
    }());
    exports.BStackVirtualParam = BStackVirtualParam;
});
