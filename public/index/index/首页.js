define(["require", "exports", "../../lib/front-mve.controls/window/form"], function (require, exports, form_1) {
    "use strict";
    function hrefOf(text, description, goto) {
        return {
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
                    ]
                },
                {
                    type: "td",
                    text: description
                }
            ]
        };
    }
    return form_1.topTitleResizeForm(function (me, p, r) {
        return {
            title: "首页",
            element: {
                type: "div",
                children: [
                    {
                        type: "table",
                        children: [
                            hrefOf("modelChildren", "自定义模型的重复节点", function () {
                                new Promise(function (resolve_1, reject_1) { require(["./modelChildren"], resolve_1, reject_1); }).then(function (modelChildren) {
                                    p.model.push(modelChildren.panel);
                                });
                            })
                        ]
                    }
                ]
            }
        };
    });
});
