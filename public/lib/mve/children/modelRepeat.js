define(["require", "exports", "./util"], function (require, exports, util_1) {
    "use strict";
    exports.__esModule = true;
    ;
    /**
    *
    build
    model
    update_index(view,index);
    insertChildBefore(new_view,old_view)
    appendChild(view)
    removeChild(view)
    init(view)
    destroy(view)
    */
    function buildModel(p) {
        var views = [];
        var view = {
            insert: function (index, row) {
                //动态加载
                var view = p.build(row, index);
                views.splice(index, 0, view);
                for (var i = index + 1; i < views.length; i++) {
                    p.update_index(views[i], i);
                }
                p.insertChild(view, views, index);
                p.init(view);
            },
            remove: function (index) {
                //动态删除
                var view = views[index];
                views.splice(index, 1);
                for (var i = index; i < views.length; i++) {
                    p.update_index(views[i], i);
                }
                p.destroy(view);
            },
            move: function (old_index, new_index) {
                var view = views[old_index];
                views.splice(old_index, 1);
                views.splice(new_index, 0, view);
                var sort = old_index < new_index ? [old_index, new_index] : [new_index, old_index];
                for (var i = sort[0]; i <= sort[1]; i++) {
                    p.update_index(views[i], i);
                }
                p.insertChild(view, views, new_index, true);
            }
        };
        p.model.addView(view);
        return {
            firstElement: function () {
                var view = views[0];
                if (view) {
                    return view.obj.firstElement();
                }
            },
            views: views,
            init: function () {
                mb.Array.forEach(views, p.init);
            },
            destroy: function () {
                mb.Array.forEach(views, p.destroy);
                p.model.removeView(view);
                views.length = 0;
            }
        };
    }
    exports.buildModel = buildModel;
    var updateModelIndex = function (view, index) {
        view.row.index(index);
    };
    function buildModelRepeat(util) {
        var getOModel = function (row, i) {
            return {
                data: row,
                index: util.Value(i)
            };
        };
        return function (child, e, x, m, p_appendChild, mx) {
            var keep = {
                appendChild: p_appendChild
            };
            var initFlag = false;
            var c_inits = []; //未贴到界面上，不执行初始化。
            //model属性
            var bm = buildModel({
                build: mx.buildChildrenOf(e, child.repeat, getOModel, keep),
                model: child.model,
                update_index: updateModelIndex,
                init: function (view) {
                    if (initFlag) {
                        view.obj.init();
                    }
                    else {
                        c_inits.push(view.obj.init);
                    }
                },
                destroy: function (view) {
                    if (initFlag) {
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
                insertChild: function (view, views, index, isMove) {
                    var count = views.length;
                    var tmpIndex = index + 1;
                    if (tmpIndex < count) {
                        /*移动到前面*/
                        var nextel_1 = null;
                        while (tmpIndex < count && nextel_1 == null) {
                            nextel_1 = util_1.findFirstElementArray(views[tmpIndex].obj.views);
                            tmpIndex++;
                        }
                        //寻找当前集合内下一个元素
                        if (nextel_1) {
                            util_1.deepRun(view.obj.views, function (el) {
                                mx.insertChildBefore(e.pel, el.element, nextel_1, isMove);
                            });
                        }
                        else {
                            util_1.deepRun(view.obj.views, function (el) {
                                keep.appendChild(e.pel, el.element, isMove);
                            });
                        }
                    }
                    else {
                        util_1.deepRun(view.obj.views, function (el) {
                            keep.appendChild(e.pel, el.element, isMove);
                        });
                    }
                }
            });
            m.inits.push(function () {
                initFlag = true;
                util.forEachRun(c_inits);
                c_inits.length = 0;
                bm.init();
            });
            m.destroys.push(bm.destroy);
            var nextObject;
            return {
                m: m,
                firstElement: bm.firstElement,
                deepRun: function (fun) {
                    for (var i = 0; i < bm.views.length; i++) {
                        util_1.deepRun(bm.views[i].obj.views, fun);
                    }
                },
                getNextObject: function () {
                    return nextObject;
                },
                setNextObject: function (obj) {
                    nextObject = obj;
                    keep.appendChild = mx.appendChildFromSetObject(obj, p_appendChild);
                }
            };
        };
    }
    exports.buildModelRepeat = buildModelRepeat;
});
