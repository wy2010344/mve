define(["require", "exports", "./div", "../lib/mve-DOM/index", "../lib/mve/ifChildren", "../lib/mve/util", "../lib/mve/filterCacheChildren", "../lib/mve/fiilterChildren"], function (require, exports, div_1, index_1, ifChildren_1, util_1, filterCacheChildren_1, fiilterChildren_1) {
    "use strict";
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
    var list = util_1.mve.valueOf([]);
    return index_1.parseHTML.mve(function (me) {
        var input;
        var element = {
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
                a("测试ViewModel", "?act=test>ViewModel"),
                a("新的mve", "?act=mve_new/demo"),
                a("手机demo", "?act=mobel/index"),
                a("手机demoFix", "?act=mobelFix/index"),
                {
                    type: "input",
                    id: function (v) {
                        input = v;
                    }
                },
                {
                    type: "button",
                    text: function () {
                        return "添加第" + (list().length + 1) + "条记录";
                    },
                    action: {
                        click: function () {
                            var v = input.value.trim();
                            mb.log(v);
                            if (v) {
                                list().unshift(v);
                                list(list());
                                input.value = "";
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
                        filterCacheChildren_1.filterCacheChildren(list, function (me, row, index) {
                            return [
                                {
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
                                                return row();
                                            }
                                        }
                                    ]
                                },
                                {
                                    type: "li",
                                    text: "我是第" + index + "个元素"
                                }
                            ];
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
                        ifChildren_1.ifChildren(function (me) {
                            return mb.Array.map(list(), function (row, index) {
                                return {
                                    type: "div",
                                    text: index + "---->" + row
                                };
                            });
                        }),
                        {
                            type: "span",
                            text: function () {
                                return "长度" + list().length;
                            }
                        },
                        "这也是一条内容",
                        ifChildren_1.ifChildren(function (me) {
                            return mb.Array.map(list(), function (row, index) {
                                return {
                                    type: "div",
                                    text: index + "---->" + row
                                };
                            });
                        }),
                        fiilterChildren_1.filterChildren(list, function (me, row, index) {
                            return {
                                init: function () {
                                    mb.log("初始化");
                                },
                                elements: {
                                    type: "div",
                                    text: index + "---->" + row
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
                        /*
                        return {
                            type:"div",
                            text(){
                                return "奇数"+list().length
                            }
                        }
                        */
                        ifChildren_1.ifChildren(function (me) {
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
                                return {
                                    init: function () {
                                        mb.log("奇数初始化");
                                    },
                                    destroy: function () {
                                        mb.log("奇数销毁");
                                    },
                                    elements: {
                                        type: "div",
                                        text: function () {
                                            return "奇数" + list().length;
                                        }
                                    }
                                };
                            }
                        })
                    ]
                }
            ]
        };
        return {
            element: element,
            init: function () {
                mb.log("初始化");
            },
            destroy: function () {
                mb.log("销毁");
            }
        };
    });
});
