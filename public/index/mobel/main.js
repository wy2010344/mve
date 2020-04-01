define(["require", "exports", "../../lib/mve/util", "../../lib/fixView/util/listView"], function (require, exports, util_1, listView_1) {
    "use strict";
    exports.__esModule = true;
    function main(width, height) {
        return {
            element: {
                type: "view",
                x: 0, y: 0, w: width, h: height,
                background: "green",
                children: [
                    {
                        type: "scroll",
                        x: 20, y: 20, h: 100, w: 100, sw: 200, sh: 200, background: "gray",
                        children: [
                            {
                                type: "button",
                                x: 100, y: 100, w: 20, h: 30, text: "点击", background: "black", click: function () {
                                    mb.log("点击");
                                }
                            }
                        ]
                    },
                    {
                        type: "input",
                        x: 100, y: 100, w: 200, h: 40,
                        value: "我是文字"
                    },
                    listView_1.listView({
                        x: 20, y: 200, h: 300, w: 200,
                        model: util_1.mve.arrayModelOf([
                            {
                                h: 30,
                                background: "black",
                                children: []
                            },
                            {
                                h: 20,
                                background: "red",
                                children: []
                            },
                            {
                                h: 100,
                                background: "blue"
                            }
                        ])
                    })
                ]
            },
            destroy: function () {
                mb.log("销毁");
            },
            init: function () {
                mb.log("初始化");
            }
        };
    }
    exports.main = main;
});
