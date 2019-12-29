define(["require", "exports", "./div"], function (require, exports, div_1) {
    "use strict";
    return function () {
        return mve(function (me) {
            var a = function (text, href) {
                return {
                    type: "a",
                    text: text,
                    attr: {
                        target: "_blank",
                        href: href
                    }
                };
            };
            var br = {
                type: "br"
            };
            var list = me.Value([]);
            return {
                element: {
                    type: "div",
                    style: {
                        overflow: "auto"
                    },
                    children: [
                        a("更新或重打包S-Lisp目录", "./S-Lisp/package"),
                        br,
                        a("S-Lisp版mve演示", "?act=S-Lisp>index>index"),
                        br,
                        a("S-Lisp的简单交互", "?act=S-shell"),
                        br,
                        a("s-html测试", "?act=s-html&path=index/s-html-test/a.s-html"),
                        br,
                        {
                            type: "input",
                            id: "input"
                        },
                        {
                            type: "button",
                            text: function () {
                                return "添加第" + (list().length + 1) + "条记录";
                            },
                            action: {
                                click: function () {
                                    var v = me.k.input.value.trim();
                                    mb.log(v);
                                    if (v) {
                                        list().unshift(v);
                                        list(list());
                                        me.k.input.value = "";
                                    }
                                    else {
                                        alert("需要输入内容");
                                    }
                                }
                            }
                        },
                        {
                            type: "ul",
                            children: [
                                {
                                    type: "li",
                                    text: function () {
                                        return "添加第" + (list().length + 1) + "条记录";
                                    }
                                },
                                mve.repeat(list, function (me, row, index) {
                                    return {
                                        element: {
                                            type: "li",
                                            children: [
                                                {
                                                    type: "button",
                                                    text: "x",
                                                    action: {
                                                        click: function () {
                                                            list().splice(index, 1);
                                                            list(list());
                                                        }
                                                    }
                                                },
                                                index + 1 + "",
                                                "-----------",
                                                {
                                                    type: "span",
                                                    text: function () {
                                                        return row() + "";
                                                    }
                                                }
                                            ]
                                        }
                                    };
                                }),
                                {
                                    type: "li",
                                    text: function () {
                                        return "添加第" + (list().length + 1) + "条记录";
                                    }
                                }
                            ]
                        },
                        div_1.div({
                            text: function () {
                                return "我是子组件。" + list().length;
                            }
                        }),
                        "我是文字，兼容性测试",
                        {
                            type: "div",
                            text: "我是返回div"
                        },
                        {
                            type: "div",
                            children: [
                                "测试multi",
                                "我亦是内容",
                                mve.repeat(list, function (me, row, index) {
                                    return {
                                        element: {
                                            type: "div",
                                            text: function () {
                                                return index + "---->" + row();
                                            }
                                        }
                                    };
                                }),
                                {
                                    type: "span",
                                    text: function () {
                                        return "长度" + list().length;
                                    }
                                },
                                "这也是一条内容",
                                mve.repeat(list, function (me, row, index) {
                                    return {
                                        element: {
                                            type: "div",
                                            text: function () {
                                                return index + "---->" + row();
                                            }
                                        }
                                    };
                                }),
                                mve.repeat(list, function (me, row, index) {
                                    return {
                                        element: {
                                            type: "div",
                                            text: function () {
                                                return index + "---->" + row();
                                            }
                                        }
                                    };
                                }),
                                {
                                    type: "span",
                                    text: function () {
                                        return "长度" + list().length;
                                    }
                                },
                                "这也是一条新1111内容",
                                mve.renders(function () {
                                    if (list().length % 2 == 0) {
                                        return [
                                            {
                                                type: "div",
                                                text: function () {
                                                    mb.log("求取偶数");
                                                    return "偶数" + list().length;
                                                }
                                            }
                                        ];
                                    }
                                    else {
                                        return function (me) {
                                            return {
                                                init: function () {
                                                    mb.log("奇数初始化");
                                                },
                                                destroy: function () {
                                                    mb.log("奇数销毁");
                                                },
                                                elements: [
                                                    {
                                                        type: "div",
                                                        text: function () {
                                                            return "奇数" + list().length;
                                                        }
                                                    }
                                                ]
                                            };
                                        };
                                    }
                                })
                            ]
                        }
                    ]
                }
            };
        });
    };
});
