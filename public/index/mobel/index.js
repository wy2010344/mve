define(["require", "exports", "../../lib/mve/util", "../../lib/baseView/index", "../../lib/baseView/index", "../../lib/baseView/mveFix/index", "../../lib/baseView/mve/modelChildren"], function (require, exports, util_1, index_1, index_2, index_3, modelChildren_1) {
    "use strict";
    var me = new index_2.BParamImpl();
    var model = util_1.mve.arrayModelOf([]);
    var result = index_3.allBuilder.stack.view(me, {
        type: "stack",
        w: 100,
        h: function () {
            return index_1.BAbsView.transH(100);
        },
        children: [
            modelChildren_1.modelChildren(model, function (me, row, i) {
                return row(me, i, model);
            })
        ]
    });
    var element = document.createElement("div");
    element.append(result.element.getElement());
    return {
        out: {
            width: function (w) {
                index_1.BAbsView.screenW(w);
                result.element.rewidth();
            },
            height: function (h) {
                index_1.BAbsView.screenH(h);
            }
        },
        element: element,
        init: function () {
            mb.log("初始化");
            model.push(function (me, index, model) {
                return [
                    {
                        children: [
                            {
                                type: "view",
                                w: 20,
                                h: 30,
                                background: "red"
                            }
                        ]
                    }
                ];
            });
        },
        destroy: function () {
            result.destroy();
            me.destroy();
        }
    };
});
