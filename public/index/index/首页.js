define(["require", "exports", "../../lib/front-mve.controls/window/form", "../../lib/mve-DOM/index", "../../lib/mve/modelChildren", "../../lib/mve/util"], function (require, exports, form_1, index_1, modelChildren_1, util_1) {
    "use strict";
    function hrefOf(text, description, goto) {
        return index_1.dom({
            type: "tr",
            children: [
                {
                    type: "td",
                    children: [
                        {
                            type: "a",
                            text: text,
                            attr: {
                                href: "javascript:void(0)"
                            },
                            action: {
                                click: goto
                            }
                        }
                    ].map(index_1.dom)
                },
                {
                    type: "td",
                    text: description
                }
            ].map(index_1.dom)
        });
    }
    return form_1.topTitleResizeForm(function (me, p, r) {
        var vs = util_1.mve.arrayModelOf([]);
        return {
            title: "首页",
            element: [
                {
                    type: "table",
                    children: [
                        index_1.dom({
                            type: "button", text: "测试", event: {
                                click: function () {
                                    vs.push("dddd");
                                }
                            }
                        }),
                        modelChildren_1.modelChildren(vs, function (me, row, index) {
                            return index_1.dom({
                                type: "div",
                                children: [
                                    {
                                        type: "button",
                                        text: "X",
                                        destroy: function () {
                                            mb.log("销毁");
                                        },
                                        action: {
                                            click: function () {
                                                vs.remove(index());
                                            }
                                        }
                                    }
                                ].map(index_1.dom)
                            });
                        })
                    ]
                }
            ].map(index_1.dom)
        };
    });
});
