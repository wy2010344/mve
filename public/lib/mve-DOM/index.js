define(["require", "exports", "../mve/mveUtil", "./DOM", "../mve/mveParse", "../mve/mveExp", "../front-lib/jsdom", "../mve/mveBuildChildren", "../mve/mveParseChildFactory", "../mve/children/multiIf", "../mve/children/filterRepeat", "../mve/children/modelRepeat", "../mve/children/filterCacheRepeat"], function (require, exports, mveUtil, DOM, mveParse, mveExp, jsdom, mveBuildChildren_1, mveParseChildFactory_1, multiIf_1, filterRepeat_1, modelRepeat_1, filterCacheRepeat_1) {
    "use strict";
    return function (p) {
        p = p || {};
        var cache = p.cache || function () {
            var w = window.top;
            if (arguments.length == 0) {
                return w._Dep_;
            }
            else {
                w._Dep_ = arguments[0];
            }
        };
        var util = mveUtil(cache);
        var bindEvent = function (map, f) {
            if (map) {
                mb.Object.forEach(map, function (v, k) {
                    f(k, v);
                });
            }
        };
        var bindKV = function (bind, key, value, f) {
            bind(value, function (v) {
                f(key, v);
            });
        };
        var bindMap = function (bind, map, f) {
            if (map) {
                mb.Object.forEach(map, function (v, k) {
                    bindKV(bind, k, v, f);
                });
            }
        };
        var replaceChild = function (e, old_el, new_el) {
            DOM.replaceWith(old_el, new_el);
        };
        var makeUp = function (e, x, json) {
            bindMap(x.bind, json.attr, function (key, value) {
                DOM.attr(e, key, value);
            });
            x.if_bind(json.cls, function (cls) {
                DOM.attr(e, "class", cls);
            });
            bindMap(x.bind, json.prop, function (key, value) {
                DOM.prop(e, key, value);
            });
            bindMap(x.bind, json.style, function (key, value) {
                DOM.style(e, key, value);
            });
            bindEvent(json.action, function (key, value) {
                DOM.action(e, key, value);
            });
            x.if_bind(json.text, function (value) {
                DOM.text(e, value);
            });
            x.if_bind(json.value, function (value) {
                DOM.value(e, value);
            });
            x.if_bind(json.content, function (value) {
                DOM.content(e, value);
            });
            x.if_bind(json.html, function (html) {
                DOM.html(e, html);
            });
            x.if_bind(json.fragment, function (cs) {
                DOM.empty(e);
                var me = {};
                if (!mb.Array.isArray(cs)) {
                    cs = [cs];
                }
                mb.Array.forEach(cs, function (c) {
                    DOM.appendChild(e, jsdom.parseElement(c, me));
                });
            });
            x.if_bind(json.element, function (element) {
                DOM.empty(e);
                DOM.appendChild(e, jsdom.parseElement(element));
            });
        };
        var mveParseChild = mveParseChildFactory_1.mveParseChildFactory(util);
        var filterRepeat = filterRepeat_1.buildRepeat(util);
        var modelRepeat = modelRepeat_1.buildModelRepeat(util);
        var filterCacheRepeat = filterCacheRepeat_1.buildFilterCacheRepeat(util);
        var buildChildrenFactory = mveBuildChildren_1.superBuildChildrenFactory(mveParseChild, function (child) {
            if (child.array) {
                child.type = filterCacheRepeat;
            }
            else if (child.model) {
                child.type = modelRepeat;
            }
            return child;
        });
        var create = function (v) {
            var parse = mveParse({
                whenNotObject: function (mve, x, e, json, m) {
                    return {
                        element: DOM.createTextNode(json || ""),
                        m: m
                    };
                },
                buildElement: function (mve, x, e, json, m) {
                    var element = v.createElement(json);
                    m = buildChildren({
                        pel: element,
                        replaceChild: replaceChild
                    }, x, json.children, m);
                    /*像select，依赖子元素先赋值再触发*/
                    makeUp(element, x, json);
                    return {
                        element: element,
                        m: m
                    };
                }
            });
            /**
             * repeat生成json结果是被观察的，受哪些影响，重新生成，替换原来的节点。
             * 生成过程，而json叶子结点里的函数引用，如style,attr，则受具体的影响
             */
            var buildChildren = buildChildrenFactory({
                removeChild: DOM.removeChild,
                insertChildBefore: DOM.insertChildBefore,
                appendChild: DOM.appendChild,
                parse: parse,
                //循环调用的注入，这种延迟最好，如果难免副作用
                mve: function (fun) {
                    return mve(fun);
                }
            });
            var mve = mveExp(util, parse);
            return mve;
        };
        var mve = create({
            createElement: function (json) {
                var NS = json.NS;
                if (NS) {
                    return DOM.createElementNS(json.type, json.NS);
                }
                else {
                    return DOM.createElement(json.type);
                }
            }
        });
        mve.svg_NS = "http://www.w3.org/2000/svg";
        mve.svg = create({
            createElement: function (json) {
                return DOM.createElementNS(json.type, mve.svg_NS);
            }
        });
        var multiIf = multiIf_1.buildMultiIf(mveParseChild);
        mve.renders = function (fun) {
            return {
                type: multiIf,
                render: fun
            };
        };
        mve.repeat = function (vs, fun) {
            if (typeof (vs) == 'function') {
                /**
                 * 单个节点内变化的，尽量使用ArrayModel。
                 * 而function的，只有自整体的render，和对应数据一致（只有reload）。不科学之处：可以改变数据吗？事实上不可以。
                 * 与fragment的区别：fragment的细节不允许有可观察片段。
                 * 但ArrayModel除了局部insert/remove也有reset，但function是自带watch的，即不破坏原结构，在中间加筛选条件。只要中间的筛选条件，就是ArrayModel。
                 */
                return {
                    type: filterRepeat,
                    array: vs,
                    repeat: fun
                };
            }
            else {
                return {
                    type: modelRepeat,
                    model: vs,
                    repeat: fun
                };
            }
        };
        mve.Watch = util.Watcher;
        mve.lifeModel = function () {
            var watchpool = [];
            return {
                me: {
                    Watch: function (w) {
                        watchpool.push(util.Watcher(w));
                    }
                },
                destroy: function () {
                    watchpool.forEach(function (w) {
                        w.disable();
                    });
                    watchpool.length = 0;
                }
            };
        };
        mve.children = function (obj) {
            if (obj.array) {
                obj.type = filterCacheRepeat;
            }
            else if (obj.model) {
                obj.type = modelRepeat;
            }
            return obj;
        };
        mve.svgCompatible = mb.Function.quote.one;
        return mve;
    };
});
