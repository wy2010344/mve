define(["require", "exports"], function (require, exports) {
    "use strict";
    return mve(function (me) {
        var vs = [];
        for (var i = 0; i < 20; i++) {
            vs.push({
                a: mve.Value(i)
            });
        }
        var vm = mve.ArrayModel(vs);
        return {
            type: "div",
            children: [
                {
                    type: "div",
                    text: "文字"
                },
                mve.repeat(vm, function (me, row, index) {
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
        };
    });
});
