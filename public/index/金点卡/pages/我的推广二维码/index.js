define(["require", "exports", "../../util/page"], function (require, exports, page_1) {
    "use strict";
    return page_1.pageOf(function (me) {
        return {
            title: "我的推广二维码",
            element: {
                type: "div",
                children: [
                    {
                        type: "img",
                        attr: {
                            src: pathOf("./Logo.png")
                        },
                        style: {
                            display: "inline-block",
                            width: "20%",
                            margin: "10%",
                            background: "gray"
                        }
                    },
                    {
                        type: "div",
                        style: {
                            "text-align": "center"
                        },
                        text: "金点卡管家"
                    },
                    {
                        type: "div",
                        style: {
                            "text-align": "center",
                            position: "absolute",
                            width: "100%",
                            bottom: "10%"
                        },
                        children: [
                            {
                                type: "img",
                                attr: {
                                    src: pathOf("./二维码.png")
                                },
                                style: {
                                    margin: "10%"
                                }
                            },
                            {
                                type: "div",
                                text: "\u63A8\u8350\u4EBA:\u5F20XX"
                            },
                            {
                                type: "div",
                                text: "\u63A8\u8350\u4EBA\u624B\u673A\u53F7\uFF1A13200010001"
                            }
                        ]
                    }
                ]
            }
        };
    });
});
