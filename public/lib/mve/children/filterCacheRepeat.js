define(["require", "exports", "./util"], function (require, exports, util_1) {
    "use strict";
    exports.__esModule = true;
    /*
    * 这个的好处，是有缓存效应。享元
    *build(row,i)=>{row:{data(),index()},obj,el}
    *init(value):新增的附加到父元素之后
    *update_data
    *destroy
    *appendChild
    *removeChild
    */
    function buildArrayOld(p) {
        var views = []; //在界面上的缓存池
        var update_views = function (array) {
            //更新视图上数据
            for (var i = 0; i < views.length; i++) {
                p.update_data(views[i], array[i]);
            }
        };
        return {
            firstElement: function () {
                var view = views[0];
                if (view) {
                    return view.obj.firstElement();
                }
            },
            views: views,
            destroy: function () {
                mb.Array.forEach(views, p.destroy);
                //watch会执行最后一次，此时会造成reset里的二次销毁
                views.length = 0;
            },
            reset: function (array) {
                if (array.length < views.length) {
                    while (views.length != array.length) {
                        var view = views.pop();
                        p.destroy(view);
                    }
                    update_views(array);
                }
                else {
                    update_views(array);
                    for (var i = views.length; i < array.length; i++) {
                        var view = p.build(array[i], i);
                        views.push(view);
                        p.appendChild(view);
                        p.init(view);
                    }
                }
            }
        };
    }
    var updateArrayData = function (view, data) {
        view.row.data(data);
    };
    function buildFilterCacheRepeat(util) {
        var getOArray = function (row, i) {
            return {
                data: util.Value(row),
                index: i //因为使用复用，所以不会发生改变
            };
        };
        return function (child, e, x, m, p_appendChild, mx) {
            var keep = {
                appendChild: p_appendChild
            };
            var c_inits = [];
            var isInit = false;
            var bc = buildArrayOld({
                build: mx.buildChildrenOf(e, child.repeat, getOArray, keep),
                init: function (view) {
                    var init = view.obj.init;
                    if (isInit) {
                        init();
                    }
                    else {
                        c_inits.push(init);
                    }
                },
                update_data: updateArrayData,
                destroy: function (view) {
                    if (isInit) {
                        view.obj.destroy();
                    }
                    else {
                        var idx = c_inits.indexOf(view.obj.init);
                        if (idx > -1) {
                            c_inits.splice(idx, 1);
                        }
                    }
                    util_1.deepRun(view.obj.views, function (el) {
                        el.remove();
                    });
                },
                appendChild: function (view) {
                    util_1.deepRun(view.obj.views, function (el) {
                        keep.appendChild(e.pel, el.element);
                    });
                }
            });
            var watch = util.Watcher({
                before: function () {
                    mx.before(e.pel);
                },
                exp: function () {
                    return child.array();
                },
                after: function (array) {
                    bc.reset(array);
                    mx.after(e.pel);
                }
            });
            m.inits.push(function () {
                isInit = true;
                util.forEachRun(c_inits);
                c_inits.length = 0;
            });
            m.destroys.push(function () {
                watch.disable();
                bc.destroy();
            });
            var nextObject;
            return {
                m: m,
                firstElement: bc.firstElement,
                getNextObject: function () {
                    return nextObject;
                },
                deepRun: function (fun) {
                    for (var i = 0; i < bc.views.length; i++) {
                        util_1.deepRun(bc.views[i].obj.views, fun);
                    }
                },
                setNextObject: function (obj) {
                    nextObject = obj;
                    keep.appendChild = mx.appendChildFromSetObject(obj, p_appendChild);
                }
            };
        };
    }
    exports.buildFilterCacheRepeat = buildFilterCacheRepeat;
});
