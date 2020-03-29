/**
 * 新起点
 * 1.生命周期不重要，生命周期只是接口需要(实现接口)，从而组合成树状结构，而不是积累，不在单独在过程中声明
 * 2.难点是children内部的混合。children是同一类型，应该可以自定义观察片段，包括if，model，reload
 * 	children时父节点肯定有了。但没有生命周期。
 * 3.单个子节点的更换，只有涉及更换时，才有if这种可能性
 * 4.新mve实现过程完全不考虑兼容老mve免于被拖累，实现完成后再去考虑。完全是数据结构与接口的。然后用prolog的数据结构描述，方便转成别的
 *
 *
 * 5.一个元素的完整结构，是有inits\destroys\element，但具体parse之前，可以简写。parser之后是这样
 * 一个元素下层可能有多种复合节点，单元素、多元素。在元素之上的if，if只作用于children，和单子节点的情况
 *
 * 为什么只处理append和insertBefore?
 * 默认都是append。动态调整是insertBefore。
 * 而不insertAfter和insertBefore。
 * 使用insertBefore，前面的节点变化不影响，后面的变化会影响。
 * 只要有邻近依赖节点都行。
 * 固定片段里不一定有元素。
 * 需要构建树状结构供遍历，parent,children,before,next几个属性
 */
define(["require", "exports", "./childrenModel", "./ifChildren", "../../lib/mve-DOM/DOM", "./modelChildren"], function (require, exports, childrenModel_1, ifChildren_1, DOM, modelChildren_1) {
    "use strict";
    function bind(me, value, fun) {
        if (typeof (value) == 'function') {
            me.Watch({
                exp: function () {
                    return value();
                },
                after: fun
            });
        }
        else {
            fun(value);
        }
    }
    function bindKV(me, map, fun) {
        mb.Object.forEach(map, function (v, k) {
            bind(me, map[k], function (v) {
                fun(k, v);
            });
        });
    }
    var buildChildren = childrenModel_1.superChildrenBuilder({
        parseChild: function (me, child) {
            var el = DOM.createElement(child.type);
            if (child.id) {
                child.id(el);
            }
            if (child.text) {
                bind(me, child.text, function (v) {
                    DOM.content(el, v);
                });
            }
            if (child.value) {
                bind(me, child.value, function (v) {
                    DOM.value(el, v);
                });
            }
            if (child.style) {
                bindKV(me, child.style, function (k, v) {
                    DOM.style(el, k, v);
                });
            }
            if (child.attr) {
                bindKV(me, child.attr, function (k, v) {
                    DOM.attr(el, k, v);
                });
            }
            if (child.action) {
                mb.Object.forEach(child.action, function (v, k) {
                    DOM.action(el, k, v);
                });
            }
            var childResult = child.children ? buildChildren(me, el, child.children) : null;
            return {
                element: el,
                init: function () {
                    if (childResult) {
                        childResult.init();
                    }
                },
                destroy: function () {
                    if (childResult) {
                        childResult.destroy();
                    }
                }
            };
        },
        insertBefore: function (pel, newEL, oldEL) {
            // mb.log("insertBefore",newEL,oldEL)
            DOM.insertChildBefore(pel, newEL, oldEL);
        },
        append: function (pel, el) {
            // mb.log("append",el)
            DOM.appendChild(pel, el);
        },
        remove: function (pel, el) {
            // mb.log("remove",el)
            DOM.removeChild(pel, el);
        }
    });
    return mve(function (me) {
        var centerV;
        var div = mve.Value(1);
        function ifChildrenOf(flag, num) {
            return ifChildren_1.ifChildren(function () {
                if (div() % num == 0) {
                    return [];
                }
                else {
                    return [
                        {
                            type: "div",
                            text: function () {
                                return flag + "标签" + div() % num;
                            }
                        }
                    ];
                }
            });
        }
        var model = mve.ArrayModel([1, 2, 3]);
        return {
            init: function () {
                var ch = buildChildren(me, centerV, [
                    {
                        type: "button",
                        style: {
                            background: "gray"
                        },
                        text: function () {
                            return "当前计数" + div();
                        },
                        action: {
                            click: function () {
                                div(div() + 1);
                                var flag = div() % 7;
                                var x = model.size() % 7;
                                mb.log(flag, x < model.size(), x, model.size());
                                model.insert(x, flag);
                                /*
                                model.unshift(model.size()+1)
                                */
                            }
                        }
                    },
                    ifChildrenOf(1, 2),
                    ifChildrenOf(2, 5),
                    modelChildren_1.modelChildren(model, function (me, row, index) {
                        return [
                            ifChildrenOf(131, 3),
                            {
                                type: "div",
                                style: {
                                    background: "yellow"
                                },
                                text: row + ""
                            },
                            ifChildrenOf(141, 7),
                        ];
                    }),
                    ifChildrenOf(5, 13)
                ]);
                ch.init();
            },
            element: {
                type: "div",
                id: function (v) {
                    centerV = v;
                }
            }
        };
    });
});
