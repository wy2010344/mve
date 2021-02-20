define(["require", "exports", "./menu"], function (require, exports, menu_1) {
    "use strict";
    exports.__esModule = true;
    exports.context_menu = void 0;
    function context_menu(fun) {
        var v_menu = menu_1.menu(fun);
        return {
            show: function (e) {
                v_menu.show(e.clientX, e.clientY);
                mb.DOM.preventDefault(e); //阻止系统菜单
                mb.DOM.stopPropagation(e); //阻止后面的菜单之类
            },
            hide: function () {
                v_menu.hide();
            },
            destroy: function () {
                v_menu.destroy();
            }
        };
    }
    exports.context_menu = context_menu;
});
