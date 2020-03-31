define(["require", "exports", "../../lib/mve/ifChildren", "../../lib/mve/modelChildren", "../../lib/mve-DOM/index", "../../lib/mve/util"], function (require, exports, ifChildren_1, modelChildren_1, index_1, util_1) {
    "use strict";
    return index_1.parseHTML.mve(function (me) {
        var centerV;
        var div = util_1.mve.valueOf(1);
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
        var model = util_1.mve.arrayModelOf([1, 2, 3]);
        return {
            init: function () { },
            destroy: function () { },
            element: {
                type: "div",
                children: [
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
                ]
            }
        };
    });
});
