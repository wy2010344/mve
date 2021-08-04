define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.VirtualChild = void 0;
    /**
     * 列表的抽象树，似乎对web的各种布局很有用，对苹果却不是很有用
     * 苹果缺少布局，总是自定义组件来布局。苹果总是一个绝对定位的UIView
     * 或者封装TableView或CollectionView。想要实现GUID。
     * TableView有cell复用，重新给cell组装数据。具体到以行数据为单位。但是视图观察全局模型呢？
     * ArrayModel不更新位置的记录，只是增删，没有视图复用。
     * model本身是自更新复用视图的，不需要显式的更新。
     * 比如要自己封装列表，最大的个性化，跟navigation/tab一样，是页面作为自定义模型。那么VirtaulChildren的意义何在呢？
     * VirtualChild最初是解决web默认布局中，重复控件尾随固定控件。
     * 而自封装列表，接受的是视图，而视图又是封装了模型的，从而达到这个效果。作为整体render的片段，或者model。原生视图里没有这样的灵活的模型控制。
     * 没有web布局的苹果环境，只有原始的view/scroll/button/label/input，要用mve去自定义布局。则原来需要VirtualTreeChild的地方，变成了某种mve的某种应用形式
     * 比如图片列表尾随一个添加窗口这种情形。在web可以使用布局解决。纯mve的模式是固定一个添加控件，封装一层insert总在前一位
     * 主要是ArrayModel没有内部的VirtaulTree。所以没有直观布局的模式。其实导航(Navigation也无直观布局)
     * iOS这种简单控件就不需要VirtaulTree，直接用原生视图，差别大吗？
     * 主要是控件的存在是否受多数据源的影响，是业务逻辑部分还是布局部分。if的情况。无默认布局所以用子view。virtualTree是封装固定位置
     * VirtualTree是为了应对默认布局
     * 以子View为单位。
     * 使用原生的appendChild。则如何转化代码？视图本身作为模型单位。
     */
    var VirtualChild = /** @class */ (function () {
        function VirtualChild(param, parent) {
            this.param = param;
            this.parent = parent;
            this.children = [];
        }
        VirtualChild.deepRun = function (view, fun) {
            if (view instanceof VirtualChild) {
                for (var i = 0; i < view.children.length; i++) {
                    VirtualChild.deepRun(view.children[i], fun);
                }
            }
            else {
                fun(view);
            }
        };
        VirtualChild.prototype.pureRemove = function (index) {
            var view = this.children.splice(index, 1)[0];
            var before = this.children[index - 1];
            var after = this.children[index];
            if (before && before instanceof VirtualChild) {
                before.after = after;
            }
            return view;
        };
        VirtualChild.prototype.remove = function (index) {
            if (index > -1 && index < this.children.length) {
                var view = this.pureRemove(index);
                var param_1 = this.param;
                VirtualChild.deepRun(view, function (e) {
                    param_1.remove(e);
                });
            }
            else {
                mb.log("\u5220\u9664" + index + "\u5931\u8D25,\u603B\u5BBD\u5EA6\u4EC5\u4E3A" + this.children.length);
            }
        };
        VirtualChild.prototype.move = function (oldIndex, newIndex) {
            if (oldIndex > -1 && oldIndex < this.children.length
                && newIndex > -1 && newIndex < this.children.length) {
                var view = this.pureRemove(oldIndex);
                var after = this.pureInsert(newIndex, view);
                var realNextEL = this.nextEL(after);
                VirtualChild.preformaceAdd(view, this.param, realNextEL, true);
            }
            else {
                mb.log("\u79FB\u52A8\u5931\u8D25" + oldIndex + "->" + newIndex + ",\u603B\u5BBD\u5EA6\u4EC5\u4E3A" + this.children.length);
            }
        };
        VirtualChild.prototype.pureInsert = function (index, view) {
            this.children.splice(index, 0, view);
            var before = this.children[index - 1];
            var after = this.children[index + 1];
            if (view instanceof VirtualChild) {
                view.parent = this;
                view.param = this.param;
                view.after = after;
            }
            if (before && before instanceof VirtualChild) {
                before.after = view;
            }
            return after;
        };
        VirtualChild.prototype.nextEL = function (after) {
            if (after) {
                return VirtualChild.realNextEO(after);
            }
            else {
                return VirtualChild.realParentNext(this);
            }
        };
        VirtualChild.prototype.insert = function (index, view) {
            if (index > -1 && index < (this.children.length + 1)) {
                var after = this.pureInsert(index, view);
                var realNextEL = this.nextEL(after);
                VirtualChild.preformaceAdd(view, this.param, realNextEL);
            }
            else {
                mb.log("\u63D2\u5165" + index + "\u5931\u8D25,\u603B\u5BBD\u5EA6\u4EC5\u4E3A" + this.children.length);
            }
        };
        VirtualChild.preformaceAdd = function (view, param, realNextEL, move) {
            if (realNextEL) {
                VirtualChild.deepRun(view, function (e) {
                    param.insertBefore(e, realNextEL, move);
                });
            }
            else {
                VirtualChild.deepRun(view, function (e) {
                    param.append(e, move);
                });
            }
        };
        VirtualChild.realNextEO = function (view) {
            if (view instanceof VirtualChild) {
                var childrenFirst = view.children[0];
                if (childrenFirst) {
                    //寻找自己的子级节点
                    return VirtualChild.realNextEO(childrenFirst);
                }
                else {
                    //自己的后继
                    var after = view.after;
                    if (after) {
                        return VirtualChild.realNextEO(after);
                    }
                    else {
                        return VirtualChild.realParentNext(view.parent);
                    }
                }
            }
            else {
                return view;
            }
        };
        VirtualChild.realParentNext = function (parent) {
            if (parent) {
                var after = parent.after;
                if (after) {
                    return VirtualChild.realNextEO(after);
                }
                else {
                    return VirtualChild.realParentNext(parent.parent);
                }
            }
            else {
                return null;
            }
        };
        VirtualChild.newRootChild = function (param) {
            return new VirtualChild(param);
        };
        VirtualChild.prototype.push = function (view) {
            return this.insert(this.children.length, view);
        };
        VirtualChild.prototype.newChildAt = function (index) {
            var child = new VirtualChild(this.param, this);
            this.insert(index, child);
            return child;
        };
        VirtualChild.prototype.newChildAtLast = function () {
            return this.newChildAt(this.children.length);
        };
        return VirtualChild;
    }());
    exports.VirtualChild = VirtualChild;
});
