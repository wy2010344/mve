define(["require", "exports", "../../mve-DOM/index", "../../mve/modelChildren", "../../mve/util"], function (require, exports, index_1, modelChildren_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.tab = void 0;
    /**
    tabs:ArrayModel 外部注入
    current
    render
    */
    function tab(me, p) {
        var tabs = p.tabs || util_1.mve.arrayModelOf([]);
        var current = p.current || util_1.mve.valueOf(null);
        return p.render(me, {
            tabs: tabs,
            current: current,
            build_head_children: function (fun) {
                return modelChildren_1.modelChildren(tabs, function (me, row, index) {
                    var element = fun(me, row, index);
                    element.action = element.action || {};
                    index_1.reWriteAction(element.action, 'mousedown', function (vs) {
                        vs.push(function () {
                            current(row);
                        });
                        return vs;
                    });
                    return index_1.dom(element);
                });
            },
            build_body_children: function (fun) {
                return modelChildren_1.modelChildren(tabs, function (me, row, index) {
                    var element = fun(me, row, index);
                    element.style = element.style || {};
                    element.style.display = function () {
                        return current() == row ? "" : "none";
                    };
                    return index_1.dom(element);
                });
            }
        });
    }
    exports.tab = tab;
});
