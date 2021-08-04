define(["require", "exports", "../mve-DOM/index", "../mve/util"], function (require, exports, index_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.menu = void 0;
    function menu(fun) {
        var body = document.body;
        var show = util_1.mve.valueOf(false);
        var top = util_1.mve.valueOf(0);
        var left = util_1.mve.valueOf(0);
        var menu = index_1.dom.root(function (me) {
            var render_object = fun(me, {});
            var p = render_object.element;
            p.type = p.type || "div";
            p.style = p.style || {};
            p.action = p.action || {};
            var style = p.style;
            var action = p.action;
            style.position = "absolute";
            style.display = function () {
                return show() ? "" : "none";
            };
            style.top = function () {
                return top() + "px";
            };
            style.left = function () {
                return left() + "px";
            };
            function hide() {
                show(false);
            }
            ;
            p.init = function () {
                mb.DOM.addEvent(document, "click", hide);
                util_1.orRun(render_object.init);
            };
            p.destroy = function () {
                mb.DOM.removeEvent(document, "click", hide);
                util_1.orRun(render_object.destroy);
            };
            return p;
        });
        var need_init = true;
        return {
            show: function (x, y) {
                if (need_init) {
                    body.appendChild(menu.element);
                    util_1.orInit(menu);
                    need_init = false;
                }
                left(x);
                top(y);
                show(true);
            },
            hide: function () {
                show(false);
            },
            destroy: function () {
                if (!need_init) {
                    //已经初始化过了
                    util_1.orDestroy(menu);
                    body.removeChild(menu.element);
                }
            }
        };
    }
    exports.menu = menu;
});
