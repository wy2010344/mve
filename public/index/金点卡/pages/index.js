define(["require", "exports", "../util/page"], function (require, exports, page_1) {
    "use strict";
    return page_1.pageOf(function (me) {
        function buttonOf(text, click) {
            return {
                type: "button",
                text: text,
                action: {
                    click: click
                }
            };
        }
        return {
            title: "链接分享页面",
            element: {
                type: "div",
                style: {
                    height: "100%",
                    background: "gray",
                    display: "flex",
                    "flex-direction": "column",
                    "justify-content": "space-around",
                    "align-items": "center"
                },
                children: [
                    buttonOf("我的推广二维码", function () {
                        cp.go("./我的推广二维码/index");
                    })
                ]
            }
        };
    });
});
