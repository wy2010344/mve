define(["require", "exports", "../../lib/mve/util", "../../lib/mve-DOM/index", "../../lib/mve/modelChildren"], function (require, exports, util_1, index_1, modelChildren_1) {
    "use strict";
    return index_1.parseHTML.mve(function (me) {
        var vs = [];
        for (var i = 0; i < 20; i++) {
            vs.push({
                a: util_1.mve.valueOf(i)
            });
        }
        var vm = util_1.mve.arrayModelOf(vs);
        return {
            init: function () { },
            destroy: function () { },
            element: {
                type: "div",
                children: [
                    {
                        type: "div",
                        text: "文字"
                    },
                    modelChildren_1.modelChildren(vm, function (me, row, index) {
                        return {
                            type: "div",
                            children: [
                                {
                                    type: "div"
                                },
                                {
                                    type: "button",
                                    text: "删除" + row.a(),
                                    action: {
                                        click: function () {
                                            vm.removeAt(index());
                                        }
                                    }
                                }
                            ]
                        };
                    })
                ]
            }
        };
    });
});
