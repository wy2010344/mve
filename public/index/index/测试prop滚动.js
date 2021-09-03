define(["require", "exports", "../../lib/front-mve.controls/window/form", "../../lib/mve-DOM/index"], function (require, exports, form_1, index_1) {
    "use strict";
    return form_1.topTitleResizeForm(function (me, p, r) {
        return {
            title: "测试prop滚动",
            element: [
                index_1.dom({
                    type: "div",
                    style: {
                        overflow: "auto",
                        height: "100%"
                    },
                    prop: {
                        scrollTop: 30
                    },
                    children: [
                        index_1.dom({
                            type: "div",
                            style: {
                                height: "800px"
                            },
                            children: [
                                index_1.dom({
                                    type: "input",
                                    attr: {
                                        type: "checkbox"
                                    },
                                    prop: {
                                        checked: true
                                    }
                                })
                            ]
                        })
                    ]
                })
            ]
        };
    });
});
