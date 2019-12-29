define(["require", "exports", "./childOperate", "./buildArray", "./buildView", "./buildModel", "./mveParseChildren"], function (require, exports, childOperate, buildArray, buildView, buildModel, mveParseChildrenFactory) {
    "use strict";
    /**
     * 递归查找下一个节点
     * @param obj
     */
    function findFirstElement(obj) {
        if (obj.element) {
            //普通节点
            return obj.element;
        }
        else {
            //复合节点
            var element = obj.firstElement();
            if (element) {
                return element;
            }
            else {
                return findFirstElement(obj.getNextObject());
            }
        }
    }
    var updateModelIndex = function (view, index) {
        view.row.index(index);
    };
    var updateArrayData = function (view, data) {
        view.row.data(data);
    };
    return function (util) {
        var mveParseChildren = mveParseChildrenFactory(util);
        var getOModel = function (row, i) {
            return {
                data: row,
                index: util.Value(i)
            };
        };
        var getOArray = function (row, i) {
            return {
                data: util.Value(row),
                index: i //因为使用复用，所以不会发生改变
            };
        };
        /**
         * 每种children的配置的
         */
        return function (p) {
            /**
             * 单元素，销毁时自动从父元素脱离
             * @param child
             * @param e
             * @param x
             * @param m
             */
            var parseObject = function (child, e, x, m) {
                var obj = p.parse(p.mve, x, e, child, m);
                m.destroys.push(function () {
                    p.removeChild(e.pel, obj.element);
                });
                return obj;
            };
            var p_before = p.before || mb.Function.quote.one;
            var p_after = p.after || mb.Function.quote.one;
            /**
             * 生成对应的appendChild方法
             * @param e
             * @param obj
             */
            function appendChildFromSetObject(obj, p_appendChild) {
                if (obj.element) {
                    return function (pel, el) {
                        p.insertChildBefore(pel, el, obj.element);
                    };
                }
                else {
                    return function (pel, el) {
                        var element = findFirstElement(obj);
                        if (element) {
                            p.insertChildBefore(pel, el, element);
                        }
                        else {
                            p_appendChild(pel, el);
                        }
                    };
                }
            }
            function parseArrayRepeat(child, e, x, m, p_appendChild) {
                var appendChild = p_appendChild;
                var c_inits = [];
                var isInit = false;
                var bc = buildArray({
                    no_cache: p.no_cache,
                    build: childOperate.build(e, child.repeat, p.mve, getOArray),
                    after: function (view) {
                        var init = childOperate.getInit(view);
                        if (isInit) {
                            init();
                        }
                        else {
                            c_inits.push(init);
                        }
                    },
                    update_data: updateArrayData,
                    destroy: childOperate.destroy,
                    appendChild: function (view) {
                        appendChild(e.pel, view.obj.element);
                    },
                    removeChild: function (view) {
                        p.removeChild(e.pel, view.obj.element);
                    }
                });
                var watch = util.Watcher({
                    before: function () {
                        p_before(e.pel);
                    },
                    exp: function () {
                        return child.array();
                    },
                    after: function (array) {
                        bc.after(array);
                        p_after(e.pel);
                    }
                });
                m.inits.push(function () {
                    mb.Array.forEach(c_inits, function (c_i) {
                        c_i();
                    });
                    isInit = true;
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
                    setNextObject: function (obj) {
                        nextObject = obj;
                        appendChild = appendChildFromSetObject(obj, p_appendChild);
                    }
                };
            }
            function parseModelRepeat(child, e, x, m, p_appendChild) {
                var appendChild = p_appendChild;
                //model属性
                var px = {
                    build: childOperate.build(e, child.repeat, p.mve, getOModel),
                    model: child.model,
                    update_index: updateModelIndex,
                    init: childOperate.init,
                    destroy: childOperate.destroy,
                    insertChildBefore: function (new_view, old_view, isMove) {
                        p.insertChildBefore(e.pel, new_view.obj.element, old_view.obj.element, isMove);
                    },
                    removeChild: function (view) {
                        p.removeChild(e.pel, view.obj.element);
                    },
                    appendChild: function (view, isMove) {
                        appendChild(e.pel, view.obj.element, isMove);
                    }
                };
                var bm;
                if (mb.Array.isArray(child.model)) {
                    bm = buildView(px);
                    if (child.id) {
                        if (m.k[child.id]) {
                            mb.log(child.id + "该id已经存在，出错");
                        }
                        else {
                            m.k[child.id] = bm.view;
                        }
                    }
                }
                else {
                    bm = buildModel(px);
                }
                m.inits.push(bm.init);
                m.destroys.push(bm.destroy);
                var nextObject;
                return {
                    m: m,
                    firstElement: bm.firstElement,
                    getNextObject: function () {
                        return nextObject;
                    },
                    setNextObject: function (obj) {
                        nextObject = obj;
                        appendChild = appendChildFromSetObject(obj, p_appendChild);
                    }
                };
            }
            /**
             * buildChildren会直接appendChild，
             * @param child
             * @param e
             * @param x
             * @param o
             * @param p_appendChild
             */
            function parseMultiIf(child, e, x, m, p_appendChild) {
                var currentObject;
                var initFlag = false;
                var keep = {
                    appendChild: p_appendChild
                };
                x.watch({
                    exp: function () {
                        return child.render();
                    },
                    after: function (json) {
                        if (typeof (json) == 'object') {
                            var mveChildren = mveParseChildren(function (me) {
                                return {
                                    elements: json
                                };
                            });
                        }
                        else {
                            var mveChildren = mveParseChildren(json);
                        }
                        var obj = mveChildren(e, realBuildChildren, keep);
                        if (currentObject) {
                            if (initFlag) {
                                currentObject.destroy();
                                obj.init();
                            }
                        }
                        currentObject = obj;
                    }
                });
                m.inits.push(function () {
                    initFlag = true;
                    if (currentObject && currentObject.init) {
                        currentObject.init();
                    }
                });
                m.destroys.push(function () {
                    if (currentObject && currentObject.destroy) {
                        currentObject.destroy();
                    }
                });
                var nextObject;
                return {
                    m: m,
                    firstElement: function () {
                        return currentObject.firstElement();
                    },
                    getNextObject: function () {
                        return nextObject;
                    },
                    setNextObject: function (obj) {
                        nextObject = obj;
                        keep.appendChild = appendChildFromSetObject(obj, p_appendChild);
                    }
                };
            }
            /**
             * 真实的组装子节点
             * @param g
             * @param e
             * @param x
             * @param children
             * @param m
             * @param appendChild 默认的追加方式
             */
            var realBuildChildren = function (e, x, children, m, appendChild) {
                var i = 0;
                var firstChild = null;
                var lastObject = null;
                var length = children.length;
                while (i < length) {
                    var child = children[i];
                    i++;
                    var thisObject = void 0;
                    if (child.array && child.repeat) {
                        thisObject = parseArrayRepeat(child, e, x, m, appendChild);
                    }
                    else if (child.model && child.repeat) {
                        thisObject = parseModelRepeat(child, e, x, m, appendChild);
                    }
                    else if (child.multi && child.render) {
                        thisObject = parseMultiIf(child, e, x, m, appendChild);
                    }
                    else {
                        var obj = parseObject(child, e, x, m);
                        appendChild(e.pel, obj.element);
                        thisObject = obj;
                    }
                    if (lastObject && 'setNextObject' in lastObject) {
                        lastObject.setNextObject(thisObject);
                    }
                    m = thisObject.m;
                    if (!firstChild) {
                        firstChild = thisObject;
                    }
                    lastObject = thisObject;
                }
                return {
                    firstElement: function () {
                        if (firstChild) {
                            return findFirstElement(firstChild);
                        }
                    },
                    firstChild: firstChild,
                    m: m
                };
            };
            return function (e, x, children, m) {
                if (children) {
                    if (mb.Array.isArray(children)) {
                        var cd = realBuildChildren(e, x, children, m, p.appendChild);
                        return cd.m;
                    }
                    else {
                        //兼容原来的
                        mb.log("将要淘汰，请使用列表式的children和me.repeat", children);
                        var newChildren = [];
                        if (children.before) {
                            newChildren = newChildren.concat(children.before);
                        }
                        newChildren.push(children);
                        if (children.after) {
                            newChildren = newChildren.concat(children.after);
                        }
                        var cd = realBuildChildren(e, x, newChildren, m, p.appendChild);
                        return cd.m;
                    }
                }
                else {
                    return m;
                }
            };
        };
    };
});
