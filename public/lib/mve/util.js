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
    var Dep = /** @class */ (function () {
        function Dep() {
            this.id = Dep.uid++;
            this.subs = {};
        }
        Dep.prototype.depend = function () {
            if (Dep.target) {
                this.subs[Dep.target.id] = Dep.target;
            }
        };
        Dep.prototype.notify = function () {
            var oldSubs = this.subs;
            this.subs = {};
            for (var key in oldSubs) {
                oldSubs[key].update();
            }
        };
        Dep.uid = 0;
        return Dep;
    }());
    var DEP_KEY = "__Dep__";
    if (window[DEP_KEY]) {
        throw "\u91CD\u590D\u52A0\u8F7D\u4E86" + pathOf() + "\u5BFC\u81F4mve\u51FA\u73B0\u4E86\u95EE\u9898";
    }
    window[DEP_KEY] = Dep;
    var mve;
    (function (mve) {
        function valueOf(v) {
            var dep = new Dep();
            return function () {
                if (arguments.length == 0) {
                    dep.depend();
                    return v;
                }
                else {
                    if (Dep.target) {
                        throw "计算期间不允许修改";
                    }
                    else {
                        v = arguments[0];
                        dep.notify();
                    }
                }
            };
        }
        mve.valueOf = valueOf;
        var ArrayModel = /** @class */ (function () {
            function ArrayModel(array) {
                this._array = mb.Array.map(array || [], function (row) {
                    return row;
                });
                this._views = [];
                //长度是可观察的
                this.size = mve.valueOf(0);
                this._reload_size_();
            }
            ArrayModel.prototype._reload_size_ = function () {
                this.size(this._array.length);
            };
            ArrayModel.prototype.addView = function (view) {
                this._views.push(view);
                //自动初始化
                for (var i = 0; i < this._array.length; i++) {
                    view.insert(i, this._array[i]);
                }
            };
            ArrayModel.prototype.removeView = function (view) {
                var index = mb.Array.indexOf(this._views, view);
                if (index != -1) {
                    this._views.splice(index, 1);
                }
            };
            ArrayModel.prototype.insert = function (index, row) {
                this._array.splice(index, 0, row);
                mb.Array.forEach(this._views, function (view) {
                    view.insert(index, row);
                });
                this._reload_size_();
            };
            ArrayModel.prototype.removeAt = function (index) {
                /*更常识的使用方法*/
                var row = this.get(index);
                this._array.splice(index, 1);
                mb.Array.forEach(this._views, function (view) {
                    view.remove(index);
                });
                this._reload_size_();
                return row;
            };
            ArrayModel.prototype.remove = function (row) {
                /*更常识的使用方法*/
                var index = this.indexOf(row);
                if (index > -1) {
                    return this.removeAt(index);
                }
            };
            ArrayModel.prototype.move = function (row, target_row) {
                /*
                常识的移动方式，向前手动则向前，向后移动则向后
                如5中第3个，可移动1,2,4,5。分别是其它几个的序号而已
                */
                var target_index = this.indexOf(target_row);
                if (target_index > -1) {
                    this.moveTo(row, target_index);
                }
            };
            ArrayModel.prototype.moveTo = function (row, target_index) {
                var index = this.indexOf(row);
                if (index > -1) {
                    this._array.splice(index, 1);
                    this._array.splice(target_index, 0, row);
                    mb.Array.forEach(this._views, function (view) {
                        view.move(index, target_index);
                    });
                    this._reload_size_();
                }
            };
            /*多控件用array和model，单控件用包装*/
            ArrayModel.prototype.moveToFirst = function (row) {
                this.moveTo(row, 0);
            };
            ArrayModel.prototype.moveToLast = function (row) {
                this.moveTo(row, this.size() - 1);
            };
            ArrayModel.prototype.get = function (index) {
                return this._array[index];
            };
            ArrayModel.prototype.shift = function () {
                return this.removeAt(0);
            };
            ArrayModel.prototype.unshift = function (row) {
                return this.insert(0, row);
            };
            ArrayModel.prototype.pop = function () {
                return this.removeAt(this.size() - 1);
            };
            ArrayModel.prototype.push = function (row) {
                return this.insert(this.size(), row);
            };
            ArrayModel.prototype.clear = function () {
                while (this.size() > 0) {
                    this.pop();
                }
            };
            ArrayModel.prototype.reset = function (array) {
                this.clear();
                var that = this;
                mb.Array.forEach(array || [], function (row) {
                    that.push(row);
                });
            };
            ArrayModel.prototype.forEach = function (fun) {
                for (var i = 0; i < this.size(); i++) {
                    fun(this.get(i), i);
                }
            };
            ArrayModel.prototype.map = function (fun) {
                var ret = [];
                for (var i = 0; i < this.size(); i++) {
                    ret[i] = fun(this.get(i), i);
                }
                return ret;
            };
            ArrayModel.prototype.reduce = function (fun, init) {
                for (var i = 0; i < this.size(); i++) {
                    init = fun(init, this.get(i), i);
                }
                return init;
            };
            ArrayModel.prototype.filter = function (fun) {
                var ret = [];
                for (var i = 0; i < this.size(); i++) {
                    var row = this.get(i);
                    if (fun(row, i)) {
                        ret.push(row);
                    }
                }
                return ret;
            };
            ArrayModel.prototype.find_index = function (fun) {
                var ret = -1;
                for (var i = 0; i < this.size() && ret == -1; i++) {
                    if (fun(this.get(i), i)) {
                        ret = i;
                    }
                }
                return ret;
            };
            ArrayModel.prototype.indexOf = function (row, fun) {
                var func = fun || function (c) {
                    return c == row;
                };
                return this.find_index(func);
            };
            ArrayModel.prototype.find_row = function (fun) {
                var index = this.find_index(fun);
                if (index > -1) {
                    return this.get(index);
                }
            };
            return ArrayModel;
        }());
        mve.ArrayModel = ArrayModel;
        function arrayModelOf(array) {
            return new ArrayModel(array);
        }
        mve.arrayModelOf = arrayModelOf;
        var Watcher = /** @class */ (function () {
            function Watcher() {
                this.id = Watcher.uid++;
                this.enable = true;
            }
            Watcher.prototype.update = function () {
                if (this.enable) {
                    this.realUpdate();
                }
            };
            Watcher.prototype.disable = function () {
                this.enable = false;
            };
            Watcher.uid = 0;
            return Watcher;
        }());
        mve.Watcher = Watcher;
        function Watch(exp) {
            return new WatcherImpl(exp);
        }
        mve.Watch = Watch;
        function WatchExp(before, exp, after) {
            return new WatcherImplExp(before, exp, after);
        }
        mve.WatchExp = WatchExp;
        function WatchBefore(before, exp) {
            return new WatcherImplBefore(before, exp);
        }
        mve.WatchBefore = WatchBefore;
        function WatchAfter(exp, after) {
            return new WatcherImplAfter(exp, after);
        }
        mve.WatchAfter = WatchAfter;
        var LifeModelImpl = /** @class */ (function () {
            function LifeModelImpl() {
                this.pool = [];
                /////兼容性问题////
                this.k = {};
                ////////
            }
            LifeModelImpl.prototype.Watch = function (exp) {
                /**兼容 */
                if (typeof (exp) == 'object') {
                    if (exp.before) {
                        if (exp.after) {
                            return this.WatchExp(exp.before, exp.exp, exp.after);
                        }
                        else {
                            return this.WatchBefore(exp.before, exp.exp);
                        }
                    }
                    else {
                        if (exp.after) {
                            return this.WatchAfter(exp.exp, exp.after);
                        }
                        else {
                            return this.Watch(exp.exp);
                        }
                    }
                }
                /****/
                this.pool.push(mve.Watch(exp));
            };
            LifeModelImpl.prototype.WatchExp = function (before, exp, after) {
                this.pool.push(mve.WatchExp(before, exp, after));
            };
            LifeModelImpl.prototype.WatchBefore = function (before, exp) {
                this.pool.push(mve.WatchBefore(before, exp));
            };
            LifeModelImpl.prototype.WatchAfter = function (exp, after) {
                this.pool.push(mve.WatchAfter(exp, after));
            };
            LifeModelImpl.prototype.Cache = function (fun) {
                var dep = new Dep();
                var cache;
                this.Watch(function () {
                    cache = fun();
                    dep.notify();
                });
                return function () {
                    dep.depend();
                    return cache;
                };
            };
            LifeModelImpl.prototype.destroy = function () {
                while (this.pool.length > 0) {
                    this.pool.pop().disable();
                }
            };
            LifeModelImpl.prototype.Value = function (v) {
                return mve.valueOf(v);
            };
            LifeModelImpl.prototype.ArrayModel = function (v) {
                return mve.arrayModelOf(v);
            };
            return LifeModelImpl;
        }());
        function newLifeModel() {
            var lm = new LifeModelImpl();
            return {
                me: lm,
                destroy: function () {
                    lm.destroy();
                }
            };
        }
        mve.newLifeModel = newLifeModel;
    })(mve = exports.mve || (exports.mve = {}));
    var WatcherImpl = /** @class */ (function (_super) {
        __extends(WatcherImpl, _super);
        function WatcherImpl(exp) {
            var _this = _super.call(this) || this;
            _this.exp = exp;
            _this.update();
            return _this;
        }
        WatcherImpl.prototype.realUpdate = function () {
            Dep.target = this;
            this.exp();
            Dep.target = null;
        };
        return WatcherImpl;
    }(mve.Watcher));
    var WatcherImplExp = /** @class */ (function (_super) {
        __extends(WatcherImplExp, _super);
        function WatcherImplExp(before, exp, after) {
            var _this = _super.call(this) || this;
            _this.before = before;
            _this.exp = exp;
            _this.after = after;
            _this.update();
            return _this;
        }
        WatcherImplExp.prototype.realUpdate = function () {
            var a = this.before();
            Dep.target = this;
            var b = this.exp(a);
            Dep.target = null;
            this.after(b);
        };
        return WatcherImplExp;
    }(mve.Watcher));
    var WatcherImplBefore = /** @class */ (function (_super) {
        __extends(WatcherImplBefore, _super);
        function WatcherImplBefore(before, exp) {
            var _this = _super.call(this) || this;
            _this.before = before;
            _this.exp = exp;
            _this.update();
            return _this;
        }
        WatcherImplBefore.prototype.realUpdate = function () {
            var a = this.before();
            Dep.target = this;
            this.exp(a);
            Dep.target = null;
        };
        return WatcherImplBefore;
    }(mve.Watcher));
    var WatcherImplAfter = /** @class */ (function (_super) {
        __extends(WatcherImplAfter, _super);
        function WatcherImplAfter(exp, after) {
            var _this = _super.call(this) || this;
            _this.exp = exp;
            _this.after = after;
            _this.update();
            return _this;
        }
        WatcherImplAfter.prototype.realUpdate = function () {
            Dep.target = this;
            var b = this.exp();
            Dep.target = null;
            this.after(b);
        };
        return WatcherImplAfter;
    }(mve.Watcher));
});
