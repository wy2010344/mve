define(["require", "exports", "./util"], function (require, exports, util_1) {
    "use strict";
    exports.__esModule = true;
    function buildMultiIf(mveParseChild) {
        return function (child, e, x, m, p_appendChild, mx) {
            var currentObject;
            var initFlag = false;
            var keep = {
                appendChild: p_appendChild
            };
            x.watch({
                before: function () {
                    mx.before(e.pel);
                },
                exp: function () {
                    return child.render();
                },
                after: function (json) {
                    if (currentObject) {
                        //先自制销毁
                        if (initFlag) {
                            currentObject.destroy();
                        }
                        //移除节点
                        util_1.deepRun(currentObject.views, function (e) {
                            e.remove();
                        });
                    }
                    if (json) {
                        //如果有返回值
                        if (typeof (json) == 'object') {
                            var mveChildren = mveParseChild(function (me) { return json; });
                        }
                        else {
                            var mveChildren = mveParseChild(json);
                        }
                        var obj = mveChildren(e, mx.realBuildChildren, keep);
                        util_1.deepRun(obj.views, function (el) {
                            keep.appendChild(e.pel, el.element);
                        });
                        if (initFlag) {
                            obj.init();
                        }
                        currentObject = obj;
                    }
                    else {
                        currentObject = null;
                    }
                    mx.after(e.pel);
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
                    if (currentObject) {
                        return currentObject.firstElement();
                    }
                    else {
                        if ('firstElement' in nextObject) {
                            return nextObject.firstElement();
                        }
                        else {
                            return nextObject.element;
                        }
                    }
                },
                getNextObject: function () {
                    return nextObject;
                },
                deepRun: function (fun) {
                    if (currentObject) {
                        util_1.deepRun(currentObject.views, fun);
                    }
                },
                setNextObject: function (obj) {
                    nextObject = obj;
                    keep.appendChild = mx.appendChildFromSetObject(obj, p_appendChild);
                }
            };
        };
    }
    exports.buildMultiIf = buildMultiIf;
});
