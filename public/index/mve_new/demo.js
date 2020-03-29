define(["require", "exports", "../../lib/mve/v2/ifChildren", "../../lib/mve/v2/modelChildren", "../../lib/mve-DOM/indexv2"], function (require, exports, ifChildren_1, modelChildren_1, indexv2_1) {
    "use strict";
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
                var ch = indexv2_1.parseHTML.children(me, centerV, [
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
