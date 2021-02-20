define(["require", "exports", "./kanren"], function (require, exports, kanren_1) {
    "use strict";
    exports.__esModule = true;
    exports.delayKanren = exports.emptyDelayStream = exports.delayStreamBindGoal = exports.delayStreamAppendStream = void 0;
    function delayStreamAppendStream(notice, a, b) {
        if (a == null) {
            b(notice);
        }
        else {
            notice(kanren_1.Pair.of(a.left, function (nv) {
                a.right(function (av) {
                    delayStreamAppendStream(nv, av, b);
                });
            }));
        }
    }
    exports.delayStreamAppendStream = delayStreamAppendStream;
    function delayStreamBindGoal(notice, a, b) {
        if (a == null) {
            notice(null);
        }
        else {
            b(function (bv) {
                delayStreamAppendStream(notice, bv, function (nv) {
                    a.right(function (av) {
                        delayStreamBindGoal(nv, av, b);
                    });
                });
            }, a.left);
        }
    }
    exports.delayStreamBindGoal = delayStreamBindGoal;
    var emptyDelayStream = function (notice) { return notice(null); };
    exports.emptyDelayStream = emptyDelayStream;
    exports.delayKanren = {
        fresh: function () {
            return new kanren_1.KVar();
        },
        fail: function (notice, sub) {
            notice(null);
        },
        success: function (notice, sub) {
            notice(kanren_1.Pair.of(sub, exports.emptyDelayStream));
        },
        eq: function (a, b) {
            return function (notice, sub) {
                var _a = kanren_1.unify(a, b, sub), success = _a[0], sub1 = _a[1];
                if (success) {
                    //合一成功，添加作用域
                    exports.delayKanren.success(notice, sub1);
                }
                else {
                    //合一失败，返回空作用域
                    exports.delayKanren.fail(notice, sub1);
                }
            };
        },
        or: function (a, b) {
            return function (notice, sub) {
                a(function (av) {
                    delayStreamAppendStream(notice, av, function (nv) {
                        b(nv, sub);
                    });
                }, sub);
            };
        },
        and: function (a, b) {
            return function (notice, sub) {
                a(function (av) {
                    delayStreamBindGoal(notice, av, b);
                }, sub);
            };
        }
    };
});
