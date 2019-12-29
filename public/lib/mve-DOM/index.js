define(["require", "exports", "../mve/mveUtil", "../mve/mveBuildChildren", "./DOM", "../mve/mveParse", "../mve/mveExp", "../front-lib/jsdom"], function (require, exports, mveUtil, superBuildChildrenFactory, DOM, mveParse, mveExp, jsdom) {
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
                mb.Array.forEach(cs, function (c) {
                    DOM.appendChild(e, jsdom.parseElement(c, me));
                });
            });
            x.if_bind(json.element, function (element) {
                DOM.empty(e);
                DOM.appendChild(e, jsdom.parseElement(element));
            });
        };
        var buildChildrenFactory = superBuildChildrenFactory(util);
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
            //兼容性
            var compatible = function (user_func, user_result) {
                if (p.debug) {
                    alert("不友好的元素节点" + user_func);
                }
                mb.log("顶层user_result目前是:", user_func, user_result);
                if (user_result && typeof (user_result) == "object") {
                    //如果是生成元素结点
                    return { type: "div", element: user_func };
                }
                else {
                    //如果是生成普通节点
                    return { type: "span", text: user_func };
                }
            };
            var mve = mveExp(util, compatible, parse);
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
        mve.svgCompatible = mb.Function.quote.one;
        return mve;
    };
});
