define(["require", "exports", "../../lib/front-mve.controls/window/form", "../../lib/mve-DOM/index", "../../lib/mve/modelChildren", "../../lib/mve/util", "./util"], function (require, exports, form_1, index_1, modelChildren_1, util_1, util_2) {
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
                            event: {
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
                        index_1.dom({
                            type: "button", text: "测试滚动", event: {
                                click: function () {
                                    new Promise(function (resolve_1, reject_1) { require(["./测试prop滚动"], resolve_1, reject_1); }).then(function (pv) {
                                        p.model.push(pv.panel);
                                    });
                                }
                            }
                        }),
                        modelChildren_1.modelChildren(vs, function (me, row, index) {
                            return index_1.dom({
                                type: "div",
                                children: [
                                    index_1.dom({
                                        type: "button",
                                        text: "X",
                                        event: {
                                            click: function () {
                                                vs.remove(index());
                                            }
                                        }
                                    }),
                                    util_2.testDomNode()
                                ]
                            });
                        })
                    ]
                }
            ].map(index_1.dom)
        };
    });
});
