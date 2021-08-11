/**
 * 与之对应的是dialog模块，是全局顶级的，弹窗可相互
 */
define(["require", "exports", "../mve-DOM/index", "../mve/modelChildren", "../mve/util"], function (require, exports, index_1, modelChildren_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.showWaitting = exports.dialogOf = exports.alertShow = void 0;
    function alertShow(p) {
        var model = util_1.mve.arrayModelOf([]);
        var ps = {
            width: p.width,
            height: p.height,
            alertShow: function (page) {
                model.push(page);
            }
        };
        ps.alertShow(p.page);
        function sameWidth() {
            return p.width() + "px";
        }
        function sameHeight() {
            return p.height() + "px";
        }
        return index_1.dom({
            type: "div",
            style: {
                position: "relative"
            },
            children: [
                modelChildren_1.modelChildren(model, function (me, row, index) {
                    var urs = row(me, ps, function () {
                        model.remove(index());
                    });
                    return index_1.dom({
                        type: "div",
                        style: {
                            position: "absolute",
                            top: "0px",
                            left: "0px",
                            width: sameWidth,
                            height: sameHeight
                        },
                        children: urs
                    });
                })
            ]
        });
    }
    exports.alertShow = alertShow;
    function dialogOf(fun) {
        return function (me, p, close) {
            var result = fun(me, p, close);
            var opacity = result.opacity || "0.2";
            return index_1.dom({
                type: "div",
                init: result.init,
                destroy: result.destroy,
                children: [
                    //背景
                    index_1.dom({
                        type: "div",
                        style: {
                            position: "absolute",
                            top: "0px",
                            left: "0px",
                            width: "100%",
                            height: "100%",
                            background: "gray",
                            opacity: opacity
                        }
                    }),
                    //前景
                    index_1.dom({
                        type: "div",
                        style: {
                            position: "absolute",
                            top: "0px",
                            left: "0px",
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            "align-items": "center",
                            "justify-content": "center"
                        },
                        event: {
                            click: result.backClick
                        },
                        children: result.content
                    })
                ]
            });
        };
    }
    exports.dialogOf = dialogOf;
    function showWaitting(pv) {
        return dialogOf(function (me, p, close) {
            return {
                init: function () {
                    var second = pv.second || 1;
                    setTimeout(function () {
                        close();
                        if (pv.complete) {
                            pv.complete();
                        }
                    }, second * 1000);
                },
                opacity: "0",
                content: index_1.dom({
                    type: "label",
                    style: {
                        background: "gray",
                        color: "white"
                    },
                    text: pv.message
                })
            };
        });
    }
    exports.showWaitting = showWaitting;
});
