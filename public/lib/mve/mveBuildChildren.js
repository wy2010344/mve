define(["require", "exports", "./children/util"], function (require, exports, util_1) {
    "use strict";
    exports.__esModule = true;
    function superBuildChildrenFactory(mveParseChild, whenNoType) {
        return function (p) {
            var p_before = p.before || mb.Function.quote.one;
            var p_after = p.after || mb.Function.quote.one;
            /**
             * 生成对应的appendChild方法
             * @param e
             * @param obj
             */
            function appendChildFromSetObject(obj, p_appendChild) {
                if ('element' in obj) {
                    return function (pel, el) {
                        p.insertChildBefore(pel, el, obj.element);
                    };
                }
                else {
                    return function (pel, el) {
                        var element = util_1.findFirstElement(obj);
                        if (element) {
                            p.insertChildBefore(pel, el, element);
                        }
                        else {
                            p_appendChild(pel, el);
                        }
                    };
                }
            }
            function buildChildrenOf(e, repeat, getO, keep) {
                return function (row, i) {
                    var o = getO(row, i);
                    var obj = mveParseChild(function (me) {
                        /*相当于修饰*/
                        return repeat(me, o.data, o.index);
                    })(e, realBuildChildren, keep);
                    return {
                        row: o,
                        obj: obj
                    };
                };
            }
            /**
            * 单元素，销毁时自动从父元素脱离
            * @param child
            * @param e
            * @param x
            * @param m
            */
            var parseObject = function (child, e, x, m) {
                var obj = p.parse(p.mve, x, e, child, m);
                obj.remove = function () {
                    p.removeChild(e.pel, obj.element);
                };
                return obj;
            };
            /**
            * 真实的组装子节点
            * 返回元素列表，手动决定组合
            * @param g
            * @param e
            * @param x
            * @param children
            * @param m
            * @param appendChild 默认的追加方式
            */
            var realBuildChildren = function (e, x, children, m, appendChild) {
                var i = 0;
                var views = [];
                var lastObject = null;
                var length = children.length;
                while (i < length) {
                    var child = children[i];
                    i++;
                    var thisObject = void 0;
                    /*
                    if(child.array && child.repeat){
                    if(child.isNew){
                    thisObject=parseArrayRepeat(child,e,x,m,appendChild)
                    }else{
                    thisObject=parseArrayRepeat_old(child,e,x,m,appendChild)
                    }
                    }else
                    if(child.model && child.repeat){
                    thisObject=parseModelRepeat(child,e,x,m,appendChild)
                    }else
                    if(child.multi && child.render){
                    thisObject=parseMultiIf(child,e,x,m,appendChild);
                    }
                    */
                    var ctype = child.type;
                    if (!ctype && child.repeat) {
                        child = whenNoType(child); //需要兼容
                        ctype = child.type;
                    }
                    if (typeof (ctype) == 'function') {
                        thisObject = ctype(child, e, x, m, appendChild, mxv);
                    }
                    else {
                        var obj = parseObject(child, e, x, m);
                        thisObject = obj;
                    }
                    if (lastObject && 'setNextObject' in lastObject) {
                        lastObject.setNextObject(thisObject);
                    }
                    m = thisObject.m;
                    views.push(thisObject);
                    lastObject = thisObject;
                }
                return {
                    firstElement: function () {
                        if (views.length != 0) {
                            return util_1.findFirstElement(views[0]);
                        }
                    },
                    views: views,
                    m: m
                };
            };
            var mxv = {
                before: p_before,
                after: p_after,
                realBuildChildren: realBuildChildren,
                buildChildrenOf: buildChildrenOf,
                parseObject: parseObject,
                appendChildFromSetObject: appendChildFromSetObject,
                insertChildBefore: p.insertChildBefore
            };
            return function (e, x, children, m) {
                if (children) {
                    if (mb.Array.isArray(children)) {
                        var newChildren = children;
                    }
                    else {
                        //兼容原来的
                        var newChildren = [];
                        if (children.before || children.after) {
                            mb.log("将要淘汰，使用before和after的方式", children);
                        }
                        if (children.before) {
                            newChildren = newChildren.concat(children.before);
                        }
                        newChildren.push(children);
                        if (children.after) {
                            newChildren = newChildren.concat(children.after);
                        }
                    }
                    var cd = realBuildChildren(e, x, newChildren, m, p.appendChild);
                    util_1.deepRun(cd.views, function (el) {
                        p.appendChild(e.pel, el.element);
                    });
                    /*
                    //可以不用，移除父节点不需要再移除孙子结点
                    cd.m.destroys.push(function(){
                    deepRun(cd.views,function(el){
                    el.remove()
                    })
                    })
                    */
                    return cd.m;
                }
                else {
                    return m;
                }
            };
        };
    }
    exports.superBuildChildrenFactory = superBuildChildrenFactory;
});
