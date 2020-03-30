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
 *
 * 不再主动声明mve，使用ifChildren和modelChildren来解决
 * 根更像ifChildren。
 * 仍然暂时不用innerHTML/content
 * 虽然ifChildren，顶层用状态机控制。下层可以继续ifChildren。
 *
 * 多种节点的一般套路
 * 有时A节点下只能容纳B\C两种节点
 * 但B节点下又可以容纳C\D节点
 * 比如菜单
 * 有时可以容纳所有类型的节点
 * 一种，依每种子节点可能的类型单独声明一组children，是各种元素的组合。
 * 	这有一个循环网，需求惰性求值，
 * 		惰性求值一种是声明一个函数去延迟访问树状作用域，
 * 		还有一种是用面向对象。但是回调是已经求值的。
 * 另一种，做一个全局通用的可替换节点，像DOM的createElement一样。便是总分关系，N+1
 * 第三种，全局也可以做，以防构造任意节点（所以必须有）。局部也可以做，根据全局传入定制。因为有全局的，所以需要区分全局类型。
 * 局部子节点可以容忍自由类型
 */
define(["require", "exports", "./DOM", "../mve/v2/index"], function (require, exports, DOM, index_1) {
    "use strict";
    exports.__esModule = true;
    var DOMVirtualParam = /** @class */ (function () {
        function DOMVirtualParam(pel) {
            this.pel = pel;
        }
        DOMVirtualParam.prototype.append = function (el) {
            DOM.appendChild(this.pel, el);
        };
        DOMVirtualParam.prototype.remove = function (el) {
            DOM.removeChild(this.pel, el);
        };
        DOMVirtualParam.prototype.insertBefore = function (el, oldEl) {
            DOM.insertChildBefore(this.pel, el, oldEl);
        };
        return DOMVirtualParam;
    }());
    function buildOf(p) {
        return function (me, child) {
            var el = p.createElement(child.type);
            if (child.id) {
                child.id(el);
            }
            if (child.text) {
                index_1.parseUtil.bind(me, child.text, function (v) {
                    DOM.content(el, v);
                });
            }
            if (child.value) {
                index_1.parseUtil.bind(me, child.value, function (v) {
                    DOM.value(el, v);
                });
            }
            if (child.style) {
                index_1.parseUtil.bindKV(me, child.style, function (k, v) {
                    DOM.style(el, k, v);
                });
            }
            if (child.attr) {
                index_1.parseUtil.bindKV(me, child.attr, function (k, v) {
                    DOM.attr(el, k, v);
                });
            }
            if (child.prop) {
                index_1.parseUtil.bindKV(me, child.prop, function (k, v) {
                    DOM.prop(el, k, v);
                });
            }
            if (child.action) {
                mb.Object.forEach(child.action, function (v, k) {
                    DOM.action(el, k, v);
                });
            }
            var childResult = child.children ? p.buildChildren(child.type, me, el, child.children) : null;
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
        };
    }
    exports.parseHTML = index_1.parseOf(buildOf({
        createElement: function (type) {
            return DOM.createElement(type);
        },
        buildChildren: function (type, me, el, children) {
            var vm = new DOMVirtualParam(el);
            if (type == "svg") {
                return exports.parseSVG.children(me, vm, children);
            }
            else {
                return exports.parseHTML.children(me, vm, children);
            }
        }
    }));
    exports.parseSVG = index_1.parseOf(buildOf({
        createElement: function (type) {
            return DOM.createElementNS(type, "http://www.w3.org/2000/svg");
        },
        buildChildren: function (type, me, el, children) {
            var vm = new DOMVirtualParam(el);
            return exports.parseSVG.children(me, vm, children);
        }
    }));
});
