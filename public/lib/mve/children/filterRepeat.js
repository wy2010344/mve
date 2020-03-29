define(["require", "exports", "./util", "../mveParseChildFactory"], function (require, exports, util_1, mveParseChildFactory_1) {
    "use strict";
    exports.__esModule = true;
    function buildRepeat(util) {
        return function (child, e, x, m, p_appendChild, mx) {
            var keep = {
                appendChild: p_appendChild
            };
            var isInit = false; //是否已贴上界面
            var views = [];
            var lastme, lastM;
            var watch = util.Watcher({
                before: function () {
                    mx.before(e.pel);
                },
                exp: function () {
                    return child.array();
                },
                after: function (array) {
                    var gm = util.generateMe();
                    if (lastme) {
                        //生命周期销毁，单个
                        lastme.destroy();
                    }
                    lastme = gm;
                    var newM = {
                        k: {},
                        inits: [],
                        destroys: []
                    };
                    if (lastM) {
                        //如果已经初始化，对上一个的进行销毁
                        if (isInit) {
                            util.forEachRun(lastM.destroys);
                        }
                        else {
                            lastM.destroys.length = 0;
                        }
                    }
                    lastM = newM;
                    //旧节点从父元素上移除
                    mb.Array.forEach(views, function (view) {
                        util_1.deepRun(view.views, function (el) {
                            el.remove();
                        });
                    });
                    views.length = 0;
                    //初始化
                    mb.Array.forEach(array, function (row, index) {
                        var dr = mveParseChildFactory_1.dealChildResult(child.repeat(gm.me, row, index));
                        var view = mx.realBuildChildren(e, gm.life, dr.elements, newM, keep.appendChild);
                        newM = view.m;
                        newM.inits.push(dr.init);
                        newM.destroys.push(dr.destroy);
                        views.push(view);
                        util_1.deepRun(view.views, function (el) {
                            keep.appendChild(e.pel, el.element);
                        });
                    });
                    if (isInit) {
                        //初始化之后，内部初始化
                        util.forEachRun(newM.inits);
                    }
                    mx.after(e.pel);
                }
            });
            m.inits.push(function () {
                isInit = true;
                util.forEachRun(lastM.inits);
            });
            m.destroys.push(function () {
                watch.disable();
                lastme.destroy();
                util.forEachRun(lastM.destroys);
            });
            var nextObject;
            return {
                m: m,
                firstElement: function () {
                    var view = views[0];
                    if (view) {
                        return view.firstElement();
                    }
                },
                getNextObject: function () {
                    return nextObject;
                },
                deepRun: function (fun) {
                    for (var i = 0; i < views.length; i++) {
                        util_1.deepRun(views[i].views, fun);
                    }
                },
                setNextObject: function (obj) {
                    nextObject = obj;
                    keep.appendChild = mx.appendChildFromSetObject(obj, p_appendChild);
                }
            };
        };
    }
    exports.buildRepeat = buildRepeat;
});
