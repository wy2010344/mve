/*
* Tween.js
* t: current time（当前时间）；
* b: beginning value（初始值）；
* c: change in value（变化量）；
* d: duration（持续时间）。
* you can visit 'http://easings.net/zh-cn' to get effect
*/
define(["require", "exports", "../../mve/util"], function (require, exports, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.drawOfBezier3 = exports.Tween = exports.TweenAnimation = exports.cacheAnimation = exports.TweenAnimationValue = exports.animationChange = exports.TweenAnimationOf = void 0;
    /**
     * 一般动画起始与结束是确定的，只在于用什么动画。
     * 多个元素可以使用相同的动画，虽然内部是不同的Animation。
     * 如果内部要使用相同的Animation，需要显式地start。
     * @param change 动画形式
     * @param duration 时间
     * @returns (起始值，终止值，回调)=>void
     */
    function TweenAnimationOf(change, duration) {
        if (duration === void 0) { duration = 1000; }
        return function (min, max, call) {
            return TweenAnimation({
                duration: duration,
                min: min,
                max: max,
                call: call,
                change: change
            });
        };
    }
    exports.TweenAnimationOf = TweenAnimationOf;
    /**
     * 对所有的value进行更新
     * @param data
     * @param change
     * @param duration
     */
    function animationChange(data, change, duration) {
        if (duration === void 0) { duration = 1000; }
        var vs = (mb.Array.isArray(data) ? data : [data]);
        for (var _i = 0, vs_1 = vs; _i < vs_1.length; _i++) {
            var v = vs_1[_i];
            v.from = v.value();
            v.update = v.update || function (from, to, percent) {
                return (to - from) * percent;
            };
        }
        TweenAnimation({
            duration: duration,
            max: 1,
            call: function (n, t) {
                for (var _i = 0, vs_2 = vs; _i < vs_2.length; _i++) {
                    var v = vs_2[_i];
                    v.value(v.update(v.from, v.to, n));
                }
            },
            change: change
        });
    }
    exports.animationChange = animationChange;
    /**
     * 用动画装饰的存储值。每次存储值改变都先引发动画。
     * @param change
     * @param duration
     * @returns
     */
    function TweenAnimationValue(change, duration) {
        if (duration === void 0) { duration = 1000; }
        return function (v) {
            return function () {
                if (arguments.length == 0) {
                    return v();
                }
                else {
                    var k = arguments[0];
                    TweenAnimation({
                        duration: duration,
                        min: v(),
                        max: k,
                        call: v,
                        change: change
                    });
                }
            };
        };
    }
    exports.TweenAnimationValue = TweenAnimationValue;
    function cacheAnimation(call, cache) {
        return function (fun) {
            var last = 0;
            var lastCancel;
            return util_1.mve.delaySetAfter(cache, function (v, set) {
                if (lastCancel) {
                    lastCancel();
                }
                lastCancel = call(last, v, function (n) {
                    set(fun(n));
                });
                last = v;
            });
        };
    }
    exports.cacheAnimation = cacheAnimation;
    /**
     * 产生动画
     * @param xp
     */
    function TweenAnimation(xp) {
        var cancel = false;
        var start = Date.now();
        var calls = [];
        if (xp.call) {
            calls.push(xp.call);
        }
        if (xp.diff) {
            var lastnum_1 = 0;
            var lastT_1 = 0;
            calls.push(function (num, t) {
                xp.diff(num - lastnum_1, t - lastT_1);
                lastnum_1 = num;
                lastT_1 = t;
            });
        }
        function oneCall(num, t) {
            for (var _i = 0, calls_1 = calls; _i < calls_1.length; _i++) {
                var call = calls_1[_i];
                call(num, t);
            }
        }
        function animate() {
            var t = Date.now() - start;
            if (t > xp.duration) {
                //结束
                oneCall(xp.max, xp.duration);
                if (xp.end) {
                    xp.end();
                }
            }
            else {
                var y = xp.change(t, xp.min || 0, xp.max, xp.duration);
                oneCall(y, t);
                if (!cancel) {
                    requestAnimationFrame(animate);
                }
            }
        }
        animate();
        return function () {
            cancel = true;
        };
    }
    exports.TweenAnimation = TweenAnimation;
    exports.Tween = {
        Linear: function (t, b, c, d) { return c * t / d + b; },
        Quad: {
            easeIn: function (t, b, c, d) {
                return c * (t /= d) * t + b;
            },
            easeOut: function (t, b, c, d) {
                return -c * (t /= d) * (t - 2) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1)
                    return c / 2 * t * t + b;
                return -c / 2 * ((--t) * (t - 2) - 1) + b;
            }
        },
        Cubic: {
            easeIn: function (t, b, c, d) {
                return c * (t /= d) * t * t + b;
            },
            easeOut: function (t, b, c, d) {
                return c * ((t = t / d - 1) * t * t + 1) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1)
                    return c / 2 * t * t * t + b;
                return c / 2 * ((t -= 2) * t * t + 2) + b;
            }
        },
        Quart: {
            easeIn: function (t, b, c, d) {
                return c * (t /= d) * t * t * t + b;
            },
            easeOut: function (t, b, c, d) {
                return -c * ((t = t / d - 1) * t * t * t - 1) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1)
                    return c / 2 * t * t * t * t + b;
                return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
            }
        },
        Quint: {
            easeIn: function (t, b, c, d) {
                return c * (t /= d) * t * t * t * t + b;
            },
            easeOut: function (t, b, c, d) {
                return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1)
                    return c / 2 * t * t * t * t * t + b;
                return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
            }
        },
        Sine: {
            easeIn: function (t, b, c, d) {
                return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
            },
            easeOut: function (t, b, c, d) {
                return c * Math.sin(t / d * (Math.PI / 2)) + b;
            },
            easeInOut: function (t, b, c, d) {
                return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
            }
        },
        Expo: {
            easeIn: function (t, b, c, d) {
                return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
            },
            easeOut: function (t, b, c, d) {
                return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
            },
            easeInOut: function (t, b, c, d) {
                if (t == 0)
                    return b;
                if (t == d)
                    return b + c;
                if ((t /= d / 2) < 1)
                    return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
                return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
            }
        },
        Circ: {
            easeIn: function (t, b, c, d) {
                return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
            },
            easeOut: function (t, b, c, d) {
                return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1)
                    return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
                return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
            }
        },
        Elastic: {
            easeIn: function (t, b, c, d, a, p) {
                var s;
                if (t == 0)
                    return b;
                if ((t /= d) == 1)
                    return b + c;
                if (typeof p == "undefined")
                    p = d * .3;
                if (!a || a < Math.abs(c)) {
                    s = p / 4;
                    a = c;
                }
                else {
                    s = p / (2 * Math.PI) * Math.asin(c / a);
                }
                return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
            },
            easeOut: function (t, b, c, d, a, p) {
                var s;
                if (t == 0)
                    return b;
                if ((t /= d) == 1)
                    return b + c;
                if (typeof p == "undefined")
                    p = d * .3;
                if (!a || a < Math.abs(c)) {
                    a = c;
                    s = p / 4;
                }
                else {
                    s = p / (2 * Math.PI) * Math.asin(c / a);
                }
                return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
            },
            easeInOut: function (t, b, c, d, a, p) {
                var s;
                if (t == 0)
                    return b;
                if ((t /= d / 2) == 2)
                    return b + c;
                if (typeof p == "undefined")
                    p = d * (.3 * 1.5);
                if (!a || a < Math.abs(c)) {
                    a = c;
                    s = p / 4;
                }
                else {
                    s = p / (2 * Math.PI) * Math.asin(c / a);
                }
                if (t < 1)
                    return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
                return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
            }
        },
        Back: {
            easeIn: function (t, b, c, d, s) {
                if (typeof s == "undefined")
                    s = 1.70158;
                return c * (t /= d) * t * ((s + 1) * t - s) + b;
            },
            easeOut: function (t, b, c, d, s) {
                if (typeof s == "undefined")
                    s = 1.70158;
                return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
            },
            easeInOut: function (t, b, c, d, s) {
                if (typeof s == "undefined")
                    s = 1.70158;
                if ((t /= d / 2) < 1)
                    return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
                return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
            }
        },
        Bounce: function () {
            var easeOut = function (t, b, c, d) {
                if ((t /= d) < (1 / 2.75)) {
                    return c * (7.5625 * t * t) + b;
                }
                else if (t < (2 / 2.75)) {
                    return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
                }
                else if (t < (2.5 / 2.75)) {
                    return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
                }
                else {
                    return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
                }
            };
            var easeIn = function easeIn(t, b, c, d) {
                return c - exports.Tween.Bounce.easeOut(d - t, 0, c, d) + b;
            };
            var easeInOut = function (t, b, c, d) {
                if (t < d / 2) {
                    return easeIn(t * 2, 0, c, d) * .5 + b;
                }
                else {
                    return easeOut(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
                }
            };
            return {
                easeIn: easeIn,
                easeInOut: easeInOut,
                easeOut: easeOut
            };
        }()
    };
    /***
     * 3阶贝塞尔，X方向与Y方向的计算是一样的。
     * @param startY 开始点Y
     * @param c1Y 开始点的控制点1
     * @param endY 结束点Y
     * @param c2Y 结束点的控制点2
     * @returns 动画函数
     */
    function drawOfBezier3(p) {
        return function bezierFun(t, b, c, d) {
            t = t / d;
            var y = p.start * Math.pow(1 - t, 3) +
                3 * p.c1 * t * Math.pow(1 - t, 2) +
                3 * p.c2 * Math.pow(t, 2) * (1 - t) +
                p.end * Math.pow(t, 3);
            return b + (300 - y) / 200 * c;
        };
    }
    exports.drawOfBezier3 = drawOfBezier3;
});
