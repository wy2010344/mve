define(["require", "exports", "../../mve-DOM/index", "../../mve-DOM/other/drag", "../../mve/util", "../window/form", "../../mve/modelChildren", "../../mve/childrenBuilder"], function (require, exports, index_1, drag_1, util_1, form_1, modelChildren_1, childrenBuilder_1) {
    "use strict";
    exports.__esModule = true;
    exports.chromeWindow = exports.chromeTab = void 0;
    function initEnv(hide, p, destroy) {
        var width = util_1.mve.valueOf(600);
        var tabs = util_1.mve.arrayModelOf([]);
        var current = util_1.mve.valueOf(null);
        var headerHeight = util_1.mve.valueOf(30);
        return {
            hide: hide,
            window: p,
            destroy: destroy,
            tabs: tabs,
            current: current,
            header: {
                width: function () {
                    return (width() - headerHeight()) / tabs.size();
                },
                height: headerHeight,
                show: util_1.mve.valueOf(true)
            },
            width: width,
            height: util_1.mve.valueOf(400),
            left: util_1.mve.valueOf(200),
            top: util_1.mve.valueOf(300)
        };
    }
    /**
     * 一个tab标签页
     */
    function chromeTab(x) {
        var envr = util_1.mve.valueOf(x.env);
        var it = {
            changeEnv: function (v) {
                envr(v);
            },
            head: null,
            body: null,
            destroy: null
        };
        var head = index_1.dom.root(function (me) {
            var left = util_1.mve.valueOf(0);
            var top = util_1.mve.valueOf(0);
            var onMove = util_1.mve.valueOf(false);
            return {
                type: "span",
                children: x.head(me, it, envr),
                style: {
                    position: "relative",
                    left: function () {
                        return left() + "px";
                    },
                    display: "inline-block",
                    width: function () {
                        return envr().header.width() + "px";
                    },
                    height: function () {
                        return envr().header.height() + "px";
                    },
                    "line-height": function () {
                        return envr().header.height() + "px";
                    },
                    color: function () {
                        return envr().current() == it ? "white" : "black";
                    },
                    "background-color": function () {
                        return envr().current() == it ? "green" : "white";
                    },
                    cursor: "pointer",
                    "z-index": function () {
                        return onMove() ? envr().current() == it ? envr().tabs.size() + "" : "" : "";
                    }
                },
                event: {
                    mousedown: drag_1.dragMoveHelper({
                        init: function () {
                            envr().current(it);
                            onMove(true);
                            if (envr().tabs.size() == 1) {
                                var panel = envr();
                                panel.top(panel.top() + panel.header.height());
                                panel.header.show(false);
                            }
                        },
                        diff: function (v) {
                            if (envr().tabs.size() == 1) {
                                var panel = envr();
                                panel.left(panel.left() + v.x);
                                panel.top(panel.top() + v.y);
                                dynamicFloatWindow(envr());
                            }
                            else {
                                var lf = left() + v.x;
                                var tp = top() + v.y;
                                var oh = envr().header.height();
                                if (tp > oh || -tp > oh) {
                                    //单出来
                                    left(0);
                                    top(0);
                                    var oldEnvr_1 = envr();
                                    var bounds = oldEnvr_1.window.getBoundingClientRect();
                                    var x_1 = v.e.x - bounds.left;
                                    var y_1 = v.e.y - bounds.top;
                                    var npanel = chromeWindow(function (env) {
                                        env.left(x_1 - (oldEnvr_1.header.width() / 2));
                                        env.top(y_1 + (oldEnvr_1.header.height() / 2));
                                        oldEnvr_1.tabs.removeEqual(it);
                                        env.current(it);
                                        env.tabs.push(it);
                                        it.changeEnv(env);
                                        env.header.show(false);
                                        oldEnvr_1.current(oldEnvr_1.tabs.getLast());
                                    });
                                    oldEnvr_1.window.model.push(npanel);
                                }
                                else {
                                    var ow = envr().header.width();
                                    if (lf > ow / 2) {
                                        //向右移动
                                        var tabs = envr().tabs;
                                        var idx = tabs.indexOf(it);
                                        if (idx < tabs.size() - 1) {
                                            tabs.move(idx, idx + 1);
                                            left(lf - ow); //小于0
                                        }
                                    }
                                    else if (-lf > ow / 2) {
                                        //向左移动
                                        var tabs = envr().tabs;
                                        var idx = tabs.indexOf(it);
                                        if (idx > 0) {
                                            tabs.move(idx, idx - 1);
                                            left(lf + ow); //大于0
                                        }
                                    }
                                    else {
                                        left(lf);
                                    }
                                }
                                top(tp);
                            }
                        },
                        cancel: function () {
                            left(0);
                            top(0);
                            onMove(false);
                            dynamicFloatWindow(null);
                            if (envr().tabs.size() == 1) {
                                var panel = envr();
                                panel.top(panel.top() - panel.header.height());
                                panel.header.show(true);
                            }
                        }
                    })
                }
            };
        });
        var body = index_1.dom.root(function (me) {
            return {
                type: "div",
                style: {
                    display: function () {
                        return envr().current() == it ? "" : "none";
                    }
                },
                children: x.body(me, it, envr)
            };
        });
        var headOut = util_1.onceLife(head, true).out;
        var bodyOut = util_1.onceLife(body, true).out;
        //要最后来销毁
        var headDestroy = headOut.destroy;
        it.head = [
            childrenBuilder_1.ChildLife.of({
                init: headOut.init
            }),
            headOut.element
        ];
        var bodyDestroy = bodyOut.destroy;
        it.body = [
            childrenBuilder_1.ChildLife.of({
                init: bodyOut.init
            }),
            bodyOut.element
        ];
        it.destroy = function () {
            if (headDestroy) {
                headDestroy();
            }
            if (bodyDestroy) {
                bodyDestroy();
            }
        };
        return it;
    }
    exports.chromeTab = chromeTab;
    var dynamicFloatWindow = util_1.mve.valueOf(null);
    function chromeWindow(init) {
        var hide = util_1.mve.valueOf(false);
        var panel = form_1.baseResizeForm({
            hide: hide,
            render: function (me, p, rp) {
                var out = initEnv(hide, p, function () {
                    p.model.removeEqual(panel);
                });
                init(out);
                return {
                    allow: function () {
                        return true;
                    },
                    width: function () {
                        return out.width();
                    },
                    height: function () {
                        if (out.header.show()) {
                            return out.header.height() + out.height();
                        }
                        else {
                            return out.height();
                        }
                    },
                    left: function () {
                        return out.left();
                    },
                    top: function () {
                        return out.top();
                    },
                    addWidth: function (w) {
                        out.width(out.width() + w);
                    },
                    addHeight: function (h) {
                        out.height(out.height() + h);
                    },
                    addTop: function (t) {
                        out.top(out.top() + t);
                    },
                    addLeft: function (l) {
                        out.left(out.left() + l);
                    },
                    element: index_1.dom({
                        type: "div",
                        style: {
                            background: "white"
                        },
                        destroy: function () {
                            out.tabs.forEach(function (tab) {
                                tab.destroy();
                            });
                        },
                        children: [
                            index_1.dom({
                                type: "div",
                                style: {
                                    overflow: "hidden",
                                    "white-space": "nowrap",
                                    "text-align": "center",
                                    background: "yellow",
                                    display: function () {
                                        return out.header.show() ? "" : "none";
                                    }
                                },
                                children: modelChildren_1.modelChildren(out.tabs, function (me, row, i) {
                                    return row.head;
                                }),
                                event: {
                                    mousedown: drag_1.dragMoveHelper({
                                        diffX: function (x) {
                                            out.left(out.left() + x);
                                        },
                                        diffY: function (y) {
                                            out.top(out.top() + y);
                                        }
                                    })
                                }
                            }),
                            index_1.dom({
                                type: "div",
                                style: {
                                    width: function () {
                                        return out.width() + "px";
                                    },
                                    height: function () {
                                        return out.height() + "px";
                                    }
                                },
                                children: modelChildren_1.modelChildren(out.tabs, function (me, row, i) {
                                    return row.body;
                                })
                            })
                        ]
                    }),
                    shadow: index_1.dom({
                        type: "div",
                        event: {
                            mouseup: function (e) {
                                if (e.offsetY < out.header.height()) {
                                    if (dynamicFloatWindow()) {
                                        var denv = dynamicFloatWindow();
                                        if (denv != out) {
                                            var idx = Math.round(e.offsetX / out.header.width());
                                            var tab = denv.tabs.get(0);
                                            denv.tabs.removeEqual(tab);
                                            denv.destroy();
                                            tab.changeEnv(out);
                                            out.tabs.insert(idx, tab);
                                            out.current(tab);
                                            dynamicFloatWindow(null);
                                            p.model.push(panel);
                                        }
                                    }
                                }
                            }
                        }
                    })
                };
            }
        });
        return panel;
    }
    exports.chromeWindow = chromeWindow;
});
