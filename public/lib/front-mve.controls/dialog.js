define(["require", "exports", "../mve-DOM/index", "../mve/util"], function (require, exports, index_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.dialogShow = exports.buildDialogN1 = void 0;
    /**
     * 一个始终居中的窗口，自定义尺寸
     * @param children
     */
    function buildDialogContent(children) {
        return {
            type: "div",
            style: {
                width: "100%",
                height: "100%",
                position: "fixed",
                top: "0px",
                left: "0px"
            },
            children: [
                {
                    type: "div",
                    style: {
                        width: "100%",
                        height: "100%",
                        background: "black",
                        opacity: "0.1",
                        position: "absolute",
                        top: "0px",
                        left: "0px"
                    }
                },
                {
                    type: "table",
                    style: {
                        width: "100%",
                        height: "100%",
                        "text-align": "center",
                        position: "relative"
                    },
                    children: [
                        {
                            type: "tbody",
                            children: [
                                {
                                    type: "tr",
                                    children: [
                                        {
                                            type: "td",
                                            children: children
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    }
    /**
     * 只有展示与隐藏
     * @param fun
     */
    function buildDialogN1(fun) {
        var body = document.body;
        var show = util_1.mve.valueOf(false);
        var dialog = index_1.parseHTML.mve(function (me) {
            var render_object = fun(me, {
                hide: function () {
                    show(false);
                }
            });
            var element = buildDialogContent(render_object);
            element.style.display = function () {
                return show() ? "" : "none";
            };
            return element;
        });
        var need_init = true;
        return {
            show: function () {
                if (need_init) {
                    body.appendChild(dialog.element);
                    util_1.orInit(dialog);
                    need_init = false;
                }
                show(true);
            },
            hide: function () {
                show(false);
            },
            destroy: function () {
                if (!need_init) {
                    //已经初始化过了
                    util_1.orDestroy(dialog);
                    body.removeChild(dialog.element);
                }
            }
        };
    }
    exports.buildDialogN1 = buildDialogN1;
    ;
    /**
     * 全局居中窗口，一次性销毁关闭
     * @param fun
     */
    function dialogShow(fun) {
        var body = document.body;
        function close() {
            util_1.orDestroy(dialog);
            body.removeChild(dialog.element);
        }
        var dialog = index_1.parseHTML.mve(function (me) {
            var render_object = fun(me, close);
            return buildDialogContent(render_object);
        });
        body.appendChild(dialog.element);
        util_1.orInit(dialog);
        return close;
    }
    exports.dialogShow = dialogShow;
});
