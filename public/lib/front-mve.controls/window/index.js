define(["require", "exports", "../../mve-DOM/index", "../../mve/modelChildren", "../../mve/util"], function (require, exports, index_1, modelChildren_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.buildSubPanel = exports.formBuilder = exports.subPanelsOf = exports.DesktopIndex = void 0;
    function DesktopIndex(init) {
        return function () {
            var width = util_1.mve.valueOf(0);
            var height = util_1.mve.valueOf(0);
            return index_1.dom.root(function (me) {
                var model = util_1.mve.arrayModelOf([]);
                var move = model.move.bind(model);
                model.move = function (fromIndex, targetIndex) {
                    /**重写*/
                    var lastIndex = model.size() - 1;
                    if (targetIndex == lastIndex) {
                        var lastRow = model.get(lastIndex);
                        var row = model.get(fromIndex);
                        if (row != lastRow) {
                            if (lastRow.focus) {
                                lastRow.focus(false);
                            }
                            if (row.focus) {
                                row.focus(true);
                            }
                        }
                    }
                    move(fromIndex, targetIndex);
                };
                var insert = model.insert.bind(model);
                model.insert = function (index, row) {
                    var idx = model.indexOf(row);
                    if (idx < 0) {
                        //不在视图中，置入
                        insert(index, row);
                    }
                    else {
                        //已经存在于视图中，聚焦
                        model.moveToLast(idx);
                    }
                };
                var p = {
                    getBoundingClientRect: function () {
                        return element.getBoundingClientRect();
                    },
                    width: width,
                    height: height,
                    model: model
                };
                function resize() {
                    var w = document.body.clientWidth;
                    var h = document.body.clientHeight;
                    if (w != width()) {
                        width(w);
                    }
                    if (h != height()) {
                        height(h);
                    }
                }
                var njo = init(p);
                njo.style = njo.style || {};
                if (njo.style.position != "absolute") {
                    njo.style.position = "relative";
                }
                var element;
                index_1.reWriteInit(njo, function (init) {
                    init.push(function (v) {
                        element = v;
                        mb.DOM.addEvent(window, "resize", resize);
                        resize();
                    });
                    return init;
                });
                index_1.reWriteDestroy(njo, function (destroy) {
                    destroy.unshift(function (v) {
                        mb.DOM.removeEvent(window, "resize", resize);
                    });
                    return destroy;
                });
                return njo;
            });
        };
    }
    exports.DesktopIndex = DesktopIndex;
    function subPanelsOf(subPanels, p) {
        var newPool = {
            getBoundingClientRect: p.getBoundingClientRect,
            width: p.width,
            height: p.width,
            model: subPanels
        };
        return modelChildren_1.modelChildren(subPanels, function (me, row, i) {
            return row.render(me, newPool, i);
        });
    }
    exports.subPanelsOf = subPanelsOf;
    function formBuilder(k) {
        return {
            focus: k.focus,
            render: function (me, p, index) {
                var v = k.render(me, p, index);
                var element = v.element;
                v.style = v.style || {};
                var style = mb.Object.ember(v.style, {
                    position: "absolute",
                    width: v.width,
                    height: v.height,
                    top: v.top,
                    left: v.left,
                    display: mb.Object.reDefine(v.style.display, function (v) {
                        if (typeof (v) == 'function') {
                            //如果是函数
                            return util_1.mve.reWriteMTValue(v, function (v) {
                                return k.hide() ? "none" : v;
                            });
                        }
                        else {
                            return function () {
                                return k.hide() ? "none" : v;
                            };
                        }
                    })
                });
                var outs = [
                    index_1.dom({
                        type: "div",
                        style: style,
                        children: element
                    })
                ];
                if (v.panels) {
                    outs = outs.concat(v.panels);
                }
                v.shadowAction = v.shadowAction || {};
                index_1.reWriteAction(v.shadowAction, 'click', function (vs) {
                    vs.push(v.shadowClick || function () {
                        p.model.moveToLast(index());
                    });
                    return vs;
                });
                outs.push(index_1.dom({
                    type: "div",
                    style: mb.Object.ember(v.shadowStyle || {}, {
                        position: "absolute",
                        width: v.width,
                        height: v.height,
                        top: v.top,
                        left: v.left,
                        background: "gray",
                        opacity: "0.1",
                        display: function () {
                            if (k.hide()) {
                                return "none";
                            }
                            else {
                                return p.model.size() - 1 == index() ? "none" : "";
                            }
                        }
                    }),
                    action: v.shadowAction
                }));
                return outs;
            }
        };
    }
    exports.formBuilder = formBuilder;
    function buildSubPanel(p) {
        var panels = [];
        return {
            /**移除模式DOM元素不复用 */
            add: function (get) {
                var thePanel;
                var onLoad = false;
                return function () {
                    if (thePanel) {
                        p.model.push(thePanel);
                    }
                    else {
                        if (!onLoad) {
                            onLoad = true;
                            get(function (panel) {
                                thePanel = panel;
                                panels.push(thePanel);
                                p.model.push(thePanel);
                                onLoad = false;
                            });
                        }
                    }
                };
            },
            /**隐藏模式 */
            addHide: function (get) {
                var thePanel;
                var onLoad = false;
                var theHide;
                return function () {
                    if (thePanel) {
                        theHide(false);
                        p.model.push(thePanel);
                    }
                    else {
                        if (!onLoad) {
                            onLoad = true;
                            get(function (panel, hide) {
                                thePanel = panel;
                                theHide = hide;
                                hide(false);
                                panels.push(thePanel);
                                p.model.push(thePanel);
                                onLoad = false;
                            });
                        }
                    }
                };
            },
            destroy: function () {
                panels.forEach(function (panel) { return p.model.removeEqual(panel); });
            }
        };
    }
    exports.buildSubPanel = buildSubPanel;
});
