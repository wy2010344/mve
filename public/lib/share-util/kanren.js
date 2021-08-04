define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.kanren = exports.buildUnifyQuery = exports.buildWalk = exports.KVar = exports.streamBindiGoal = exports.streamBindGoal = exports.extendSubsitution = exports.streamInterleaveStream = exports.streamAppendStream = exports.emptyDelayStream = exports.Pair = void 0;
    var Pair = /** @class */ (function () {
        function Pair(left, right) {
            this.left = left;
            this.right = right;
        }
        Pair.of = function (left, right) {
            return new Pair(left, right);
        };
        Pair.prototype.toString = function () {
            var left = this.left instanceof Pair ? "[" + this.left.toString() + "]" : this.left;
            return left + " -> " + this.right;
        };
        return Pair;
    }());
    exports.Pair = Pair;
    var emptyDelayStream = function () { return null; };
    exports.emptyDelayStream = emptyDelayStream;
    /**
     * 增加世界线b
     * 在a流查找后（包括a的所有后继），在b的流继续查找
     * @param a
     * @param b
     */
    function streamAppendStream(a, b) {
        if (a == null) {
            return b();
        }
        else {
            //如果a有后继，追加到后继之后
            return Pair.of(a.left, function () {
                return streamAppendStream(a.right(), b);
            });
        }
    }
    exports.streamAppendStream = streamAppendStream;
    /**
     * 与append对应的
     * @param a
     * @param b
     */
    function streamInterleaveStream(a, b) {
        if (a == null) {
            return b();
        }
        else {
            return Pair.of(a.left, function () {
                return streamInterleaveStream(b(), a.right);
            });
        }
    }
    exports.streamInterleaveStream = streamInterleaveStream;
    /**
     * 作用域扩展
     * @param key
     * @param value
     * @param parent
     */
    function extendSubsitution(key, value, parent) {
        return Pair.of(Pair.of(key, value), parent);
    }
    exports.extendSubsitution = extendSubsitution;
    /**
     * 为所有的世界线应用一个条件，变换成新的世界线列表
     * 在a流中，使用b目标查找，每一个节点的尝试
     * 用于and语句。
     * @param a
     * @param b
     */
    function streamBindGoal(a, b) {
        if (a == null) {
            return null;
        }
        else {
            //如果a有后继流，则递归处理
            return streamAppendStream(b(a.left), function () {
                return streamBindGoal(a.right(), b);
            });
        }
    }
    exports.streamBindGoal = streamBindGoal;
    /**
     *
     * @param a
     * @param b
     */
    function streamBindiGoal(a, b) {
        if (a == null) {
            return null;
        }
        else {
            return streamInterleaveStream(b(a.left), function () {
                return streamBindiGoal(a.right(), b);
            });
        }
    }
    exports.streamBindiGoal = streamBindiGoal;
    /**变量 */
    var KVar = /** @class */ (function () {
        function KVar(flag) {
            if (flag === void 0) { flag = "_" + KVar.UID++; }
            this.flag = flag;
        }
        KVar.prototype.toString = function () {
            return "Var(" + this.flag + ")";
        };
        KVar.prototype.equals = function (v) {
            return v == this || (v instanceof KVar && v.flag == this.flag);
        };
        KVar.UID = 0;
        return KVar;
    }());
    exports.KVar = KVar;
    /**
     * 在作用域中寻找变量的定义
     * @param v 变量
     * @param sub 作用域
     */
    function find(v, sub) {
        while (sub != null) {
            var kv = sub.left;
            if (kv.left == v || v.equals(kv.left)) {
                return kv;
            }
            sub = sub.right;
        }
        return null;
    }
    function buildWalk(other) {
        var walk = function (v, sub) {
            if (v instanceof KVar) {
                var val = find(v, sub);
                if (val) {
                    //变量如果找到定义，对定义递归寻找
                    return walk(val.right, sub);
                }
                return v;
            }
            else {
                return other(v, sub);
            }
        };
        return walk;
    }
    exports.buildWalk = buildWalk;
    function buildUnifyQuery(walk, unifyQueryOther) {
        var unifyQuery = function (a, b, sub) {
            a = walk(a, sub);
            b = walk(b, sub);
            if (a == b) {
                return [true, sub];
            }
            if (a instanceof KVar) {
                if (a.equals(b)) {
                    return [true, sub];
                }
                return [true, extendSubsitution(a, b, sub)];
            }
            if (b instanceof KVar) {
                if (b.equals(a)) {
                    return [true, sub];
                }
                return [true, extendSubsitution(b, a, sub)];
            }
            return unifyQueryOther(a, b, sub);
        };
        return unifyQuery;
    }
    exports.buildUnifyQuery = buildUnifyQuery;
    function check(fun) {
        return function (v) {
            return function (sub) {
                if (fun(v)) {
                    return exports.kanren.success(sub);
                }
                else {
                    return exports.kanren.fail(sub);
                }
            };
        };
    }
    function toArray(term) {
        if (term instanceof Pair) {
            var first = term.left;
            var vm = toArray(term.right);
            vm[0].unshift(first);
            return vm;
        }
        else {
            return [[], term];
        }
    }
    exports.kanren = {
        fresh: function () {
            return new KVar();
        },
        fail: function (sub) {
            return null;
        },
        success: function (sub) {
            return Pair.of(sub, exports.emptyDelayStream);
        },
        pair: function (v1, v2) {
            return Pair.of(v1, v2);
        },
        list: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var ret = null;
            for (var i = args.length - 1; i > -1; i--) {
                ret = Pair.of(args[i], ret);
            }
            return ret;
        },
        toArray: toArray,
        check: check,
        isVar: check(function (v) { return v instanceof KVar; }),
        notVar: check(function (v) { return !(v instanceof KVar); }),
        /**
         * 叶子节点的世界线。
         * 如果合一成功，则添加定义，返回一条世界线。
         * 合一失败，则该世界线消失。
         * @param a
         * @param b
         */
        query: function (a, b, unify) {
            return function (sub) {
                var _a = unify(a, b, sub), success = _a[0], sub1 = _a[1];
                if (success) {
                    //合一成功，添加作用域
                    return exports.kanren.success(sub1);
                }
                //合一失败，返回空作用域
                return exports.kanren.fail(sub1);
            };
        },
        /**
         * 增加世界线
         * 如果其中任意一个没有成功，比如是eq的goal，则只返回另一个goal，世界线并没有增加
         * @param a
         * @param b
         */
        or: function (a, b) {
            return function (sub) {
                return streamAppendStream(a(sub), function () {
                    return b(sub);
                });
            };
        },
        cut: function (a, b) {
            return function (sub) {
                var v = a(sub);
                if (v) {
                    return v;
                }
                else {
                    return b(sub);
                }
            };
        },
        ori: function (a, b) {
            return function (sub) {
                return streamInterleaveStream(a(sub), function () {
                    return b(sub);
                });
            };
        },
        /**
         * 为所有的世界线增加一个条件
         * 如果其中任何一个goal没有成功，比如是eq的goal
         * 如果a是空，则返回空。如果b是空，则所有a的世界线都会终结
         * 追加a成功后追加b。
         * @param a
         * @param b
         */
        and: function (a, b) {
            return function (sub) {
                return streamBindGoal(a(sub), b);
            };
        },
        andi: function (a, b) {
            return function (sub) {
                return streamBindiGoal(a(sub), b);
            };
        },
        all: function () {
            var gs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                gs[_i] = arguments[_i];
            }
            if (gs.length == 0) {
                return exports.kanren.success;
            }
            if (gs.length == 1) {
                return gs[0];
            }
            return exports.kanren.and(gs[0], exports.kanren.all.apply(null, gs.slice(1)));
        },
        alli: function () {
            var gs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                gs[_i] = arguments[_i];
            }
            if (gs.length == 0) {
                return exports.kanren.success;
            }
            if (gs.length == 1) {
                return gs[0];
            }
            return exports.kanren.andi(gs[0], exports.kanren.alli.apply(null, gs.slice(1)));
        },
        any: function () {
            var gs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                gs[_i] = arguments[_i];
            }
            if (gs.length == 0) {
                return exports.kanren.fail;
            }
            if (gs.length == 1) {
                return gs[0];
            }
            return exports.kanren.or(gs[0], exports.kanren.any.apply(null, gs.slice(1)));
        },
        anyi: function () {
            var gs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                gs[_i] = arguments[_i];
            }
            if (gs.length == 0) {
                return exports.kanren.fail;
            }
            if (gs.length == 1) {
                return gs[0];
            }
            return exports.kanren.ori(gs[0], exports.kanren.anyi.apply(null, gs.slice(1)));
        },
        match: function () {
            var gs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                gs[_i] = arguments[_i];
            }
            if (gs.length == 0) {
                return exports.kanren.fail;
            }
            if (gs.length == 1) {
                return gs[0];
            }
            return exports.kanren.cut(gs[0], exports.kanren.match.apply(null, gs.slice(1)));
        }
    };
});
