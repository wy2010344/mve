var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.onceLife = exports.BuildResultList = exports.orDestroy = exports.orInit = exports.orRun = exports.mve = void 0;
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
        Dep.watcherCount = 0;
        return Dep;
    }());
    var mve;
    (function (mve) {
        function delaySetAfter(fun, after) {
            var newFun = fun;
            newFun.after = after;
            return newFun;
        }
        mve.delaySetAfter = delaySetAfter;
        /**新存储器*/
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
        /**
         * 转化成统一的函数
         * @param a
         */
        function valueOrCall(a) {
            if (typeof (a) == 'function') {
                return a;
            }
            else {
                return function () { return a; };
            }
        }
        mve.valueOrCall = valueOrCall;
        /**
         * 重写属性值为可观察
         * @param a
         * @param fun
         */
        function reWriteMTValue(a, fun) {
            var after = a['after'];
            var vm = function () { return fun(a()); };
            vm.after = after;
            return vm;
        }
        mve.reWriteMTValue = reWriteMTValue;
        /**构造只读的模型*/
        var CacheArrayModel = /** @class */ (function () {
            function CacheArrayModel(size, array, views) {
                this.size = size;
                this.array = array;
                this.views = views;
            }
            CacheArrayModel.prototype.addView = function (view) {
                this.views.push(view);
                //自动初始化
                for (var i = 0; i < this.array.length; i++) {
                    view.insert(i, this.array[i]);
                }
            };
            CacheArrayModel.prototype.removeView = function (view) {
                var index = mb.Array.indexOf(this.views, view);
                if (index != -1) {
                    this.views.splice(index, 1);
                }
            };
            CacheArrayModel.prototype.get = function (i) {
                //不支持响应式
                return this.array.get(i);
            };
            CacheArrayModel.prototype.getLast = function () {
                return mb.Array.getLast(this);
            };
            CacheArrayModel.prototype.findIndex = function (fun) {
                return mb.Array.findIndex(this, fun);
            };
            CacheArrayModel.prototype.forEach = function (fun) {
                mb.Array.forEach(this, fun);
            };
            CacheArrayModel.prototype.map = function (fun) {
                return mb.Array.map(this, fun);
            };
            CacheArrayModel.prototype.reduce = function (fun, init) {
                return mb.Array.reduce(this, fun, init);
            };
            CacheArrayModel.prototype.filter = function (fun) {
                return mb.Array.filter(this, fun);
            };
            CacheArrayModel.prototype.findRow = function (fun) {
                return mb.Array.findRow(this, fun);
            };
            CacheArrayModel.prototype.indexOf = function (row) {
                return this.findIndex(function (theRow) { return theRow == row; });
            };
            return CacheArrayModel;
        }());
        mve.CacheArrayModel = CacheArrayModel;
        var ArrayModel = /** @class */ (function (_super) {
            __extends(ArrayModel, _super);
            function ArrayModel(array) {
                var _this = this;
                array = mb.Array.map(array || [], function (row) {
                    return row;
                });
                var size_value = mve.valueOf(0);
                var views_value = [];
                _this = _super.call(this, size_value, array, views_value) || this;
                _this.size_value = size_value;
                _this.array_value = array;
                _this.views_value = views_value;
                //长度是可观察的
                _this.reload_size();
                return _this;
            }
            ArrayModel.prototype.reload_size = function () {
                this.size_value(this.array_value.length);
            };
            ArrayModel.prototype.insert = function (index, row) {
                this.array_value.splice(index, 0, row);
                mb.Array.forEach(this.views_value, function (view) {
                    view.insert(index, row);
                });
                this.reload_size();
            };
            ArrayModel.prototype.remove = function (index) {
                /*更常识的使用方法*/
                var row = this.get(index);
                this.array_value.splice(index, 1);
                mb.Array.forEach(this.views_value, function (view) {
                    view.remove(index);
                });
                this.reload_size();
                return row;
            };
            ArrayModel.prototype.set = function (index, row) {
                var oldRow = this.array_value.splice(index, 1, row)[0];
                mb.Array.forEach(this.views_value, function (view) {
                    view.set(index, row);
                });
                this.reload_size();
                return oldRow;
            };
            /**清理匹配项 */
            ArrayModel.prototype.removeWhere = function (fun) {
                mb.Array.removeWhere(this, fun);
            };
            /**清理单纯相等的项 */
            ArrayModel.prototype.removeEqual = function (row) {
                this.removeWhere(function (theRow) { return theRow == row; });
            };
            ArrayModel.prototype.move = function (oldIndex, newIndex) {
                /**有效的方法*/
                mb.Array.move(this.array_value, oldIndex, newIndex);
                mb.Array.forEach(this.views_value, function (view) {
                    view.move(oldIndex, newIndex);
                });
                this.reload_size();
            };
            /*多控件用array和model，单控件用包装*/
            ArrayModel.prototype.moveToFirst = function (index) {
                this.move(index, 0);
            };
            ArrayModel.prototype.moveToLast = function (index) {
                this.move(index, this.size_value() - 1);
            };
            ArrayModel.prototype.shift = function () {
                return this.remove(0);
            };
            ArrayModel.prototype.unshift = function (row) {
                return this.insert(0, row);
            };
            ArrayModel.prototype.pop = function () {
                return this.remove(this.size_value() - 1);
            };
            ArrayModel.prototype.push = function (row) {
                return this.insert(this.size_value(), row);
            };
            ArrayModel.prototype.clear = function () {
                while (this.size_value() > 0) {
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
            return ArrayModel;
        }(CacheArrayModel));
        mve.ArrayModel = ArrayModel;
        function arrayModelOf(array) {
            return new ArrayModel(array);
        }
        mve.arrayModelOf = arrayModelOf;
        var Watcher = /** @class */ (function () {
            function Watcher() {
                this.id = Watcher.uid++;
                this.enable = true;
                Dep.watcherCount++;
            }
            Watcher.prototype.update = function () {
                if (this.enable) {
                    this.realUpdate();
                }
            };
            Watcher.prototype.disable = function () {
                this.enable = false;
                Dep.watcherCount--;
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
                this.destroyList = [];
                this.pool = [];
            }
            LifeModelImpl.prototype.Watch = function (exp) {
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
                for (var _i = 0, _a = this.destroyList; _i < _a.length; _i++) {
                    var destroy = _a[_i];
                    destroy();
                }
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
    function orRun(v) {
        if (v) {
            v();
        }
    }
    exports.orRun = orRun;
    function orInit(v) {
        if (v.init) {
            v.init();
        }
    }
    exports.orInit = orInit;
    function orDestroy(v) {
        if (v.destroy) {
            v.destroy();
        }
    }
    exports.orDestroy = orDestroy;
    var BuildResultList = /** @class */ (function () {
        function BuildResultList() {
            this.inits = [];
            this.destroys = [];
        }
        BuildResultList.init = function () {
            var xs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                xs[_i] = arguments[_i];
            }
            var it = new BuildResultList();
            for (var i = 0; i < xs.size(); i++) {
                it.push(xs.get(i));
            }
            return it;
        };
        BuildResultList.prototype.orPush = function (v) {
            if (v) {
                this.push(v);
            }
        };
        BuildResultList.prototype.push = function (v) {
            if (v.init) {
                this.inits.push(v.init);
            }
            if (v.destroy) {
                this.destroys.push(v.destroy);
            }
        };
        BuildResultList.prototype.getInit = function () {
            var inits = this.inits;
            var size = inits.size();
            if (size > 1) {
                return function () {
                    for (var i = 0; i < size; i++) {
                        inits[i]();
                    }
                };
            }
            else if (size == 1) {
                return inits[0];
            }
        };
        BuildResultList.prototype.getDestroy = function () {
            var destroys = this.destroys;
            var size = destroys.size();
            if (size > 1) {
                return function () {
                    for (var i = size - 1; i > -1; i--) {
                        destroys[i]();
                    }
                };
            }
            else if (size == 1) {
                return destroys[0];
            }
        };
        BuildResultList.prototype.getAsOne = function (e) {
            return {
                element: e,
                init: this.getInit(),
                destroy: this.getDestroy()
            };
        };
        return BuildResultList;
    }());
    exports.BuildResultList = BuildResultList;
    function onceLife(p, nowarn) {
        var warn = !nowarn;
        var self = {
            isInit: false,
            isDestroy: false,
            out: p
        };
        var init = p.init;
        var destroy = p.destroy;
        if (init) {
            p.init = function () {
                if (self.isInit) {
                    if (warn) {
                        mb.log("禁止重复init");
                    }
                }
                else {
                    self.isInit = true;
                    init();
                }
            };
            if (!destroy) {
                p.destroy = function () {
                    if (self.isDestroy) {
                        if (warn) {
                            mb.log("禁止重复destroy");
                        }
                    }
                    else {
                        self.isDestroy = true;
                        if (!self.isInit) {
                            mb.log("未初始化故不销毁");
                        }
                    }
                };
            }
        }
        if (destroy) {
            if (!init) {
                p.init = function () {
                    if (self.isInit) {
                        if (warn) {
                            mb.log("禁止重复init");
                        }
                    }
                    else {
                        self.isInit = true;
                    }
                };
            }
            p.destroy = function () {
                if (self.isDestroy) {
                    if (warn) {
                        mb.log("禁止重复destroy");
                    }
                }
                else {
                    self.isDestroy = true;
                    if (self.isInit) {
                        destroy();
                    }
                    else {
                        mb.log("未初始化故不销毁");
                    }
                }
            };
        }
        return self;
    }
    exports.onceLife = onceLife;
});
