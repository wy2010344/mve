define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var VirtualChild = /** @class */ (function () {
        function VirtualChild(param, pel, parent) {
            this.param = param;
            this.pel = pel;
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
        VirtualChild.prototype.size = function () {
            return this.children.length;
        };
        VirtualChild.prototype.get = function (index) {
            return this.children[index];
        };
        VirtualChild.prototype.firstChild = function () {
            return this.children[0];
        };
        VirtualChild.prototype.lastChild = function () {
            return this.children[this.children.length - 1];
        };
        VirtualChild.prototype.remove = function (index) {
            var view = this.children.splice(index, 1)[0];
            if (view) {
                var before = this.children[index - 1];
                var after = this.children[index];
                if (before && before instanceof VirtualChild) {
                    before.after = after;
                }
                if (after && after instanceof VirtualChild) {
                    after.before = before;
                }
                var that_1 = this;
                VirtualChild.deepRun(view, function (e) {
                    that_1.param.remove(that_1.pel, e);
                });
            }
            else {
                mb.log("\u5220\u9664" + index + "\u5931\u8D25,\u603B\u5BBD\u5EA6\u4EC5\u4E3A" + this.size());
            }
        };
        VirtualChild.prototype.realNextEO = function (view) {
            if (view instanceof VirtualChild) {
                var childrenFirst = view.firstChild();
                if (childrenFirst) {
                    //寻找自己的子级节点
                    return this.realNextEO(childrenFirst);
                }
                else {
                    //自己的后继
                    var after = view.after;
                    if (after) {
                        return this.realNextEO(after);
                    }
                    else {
                        return this.realParentNext(view.parent);
                    }
                }
            }
            else {
                return view;
            }
        };
        VirtualChild.prototype.realParentNext = function (parent) {
            if (parent) {
                var after = parent.after;
                if (after) {
                    return this.realNextEO(after);
                }
                else {
                    return this.realParentNext(parent.parent);
                }
            }
            else {
                return null;
            }
        };
        VirtualChild.prototype.insert = function (index, view) {
            if (index > -1 && index < (this.children.length + 1)) {
                this.children.splice(index, 0, view);
                var before = this.children[index - 1];
                var after = this.children[index + 1];
                if (view instanceof VirtualChild) {
                    view.parent = this;
                    view.param = this.param;
                    view.pel = this.pel;
                    view.before = before;
                    view.after = after;
                }
                if (before && before instanceof VirtualChild) {
                    before.after = view;
                }
                if (after && after instanceof VirtualChild) {
                    after.before = view;
                }
                var that_2 = this;
                var realNextEL_1 = after ? that_2.realNextEO(after) : that_2.realParentNext(that_2);
                VirtualChild.deepRun(view, function (e) {
                    if (realNextEL_1) {
                        that_2.param.insertBefore(that_2.pel, e, realNextEL_1);
                    }
                    else {
                        that_2.param.append(that_2.pel, e);
                    }
                });
            }
            else {
                mb.log("\u63D2\u5165" + index + "\u5931\u8D25,\u603B\u5BBD\u5EA6\u4EC5\u4E3A" + this.size());
            }
        };
        VirtualChild.newRootChild = function (param, pel) {
            return new VirtualChild(param, pel);
        };
        VirtualChild.prototype.push = function (view) {
            return this.insert(this.children.length, view);
        };
        VirtualChild.prototype.newChildAt = function (index) {
            var child = new VirtualChild(this.param, this.pel, this);
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
