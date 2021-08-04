define(["require", "exports", "../mve-DOM/index", "../mve/util", "./menu"], function (require, exports, index_1, util_1, menu_1) {
    "use strict";
    exports.__esModule = true;
    exports.select = void 0;
    /*
    input(me)
    menu(me)
    select:选中事件
    value:观察者
    */
    function select(p) {
        return index_1.dom.root(function (me) {
            var filter = util_1.mve.valueOf("");
            var inputElement;
            var input = p.input(me, {
                select: p.select,
                value: p.value,
                setInput: function (v) {
                    inputElement = v;
                },
                show_menu: function () {
                    var x = inputElement;
                    v_menu.show(x.offsetLeft, x.offsetTop + x.offsetHeight);
                },
                filter: function (v) {
                    if (v != filter()) {
                        filter(v);
                    }
                }
            });
            var v_menu = menu_1.menu(function (me) {
                return p.menu(me, {
                    select: p.select,
                    value: p.value,
                    filter: filter //不允许从下方改变筛选
                });
            });
            var destroy = input.destroy;
            index_1.reWriteDestroy(input, function (destroy) {
                destroy.unshift(function () {
                    v_menu.destroy();
                });
                return destroy;
            });
            return input;
        });
    }
    exports.select = select;
});
