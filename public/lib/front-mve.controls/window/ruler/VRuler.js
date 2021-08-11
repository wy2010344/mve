define(["require", "exports", "../form", "../../../mve/modelChildren", "../../../mve/util", "../../../mve-DOM/index"], function (require, exports, form_1, modelChildren_1, util_1, index_1) {
    "use strict";
    exports.__esModule = true;
    exports.vRuler = void 0;
    function vRuler(param) {
        return form_1.resizeForm(function (me, p, rp) {
            var model = util_1.mve.arrayModelOf([]);
            me.WatchAfter(function () {
                return rp.out.height() / param.bit;
            }, function (size) {
                var i = model.size();
                while (i < size) {
                    model.push(i);
                    i++;
                }
            });
            return {
                allow: function () {
                    return true;
                },
                element: index_1.svg({
                    type: "svg",
                    event: {
                        mousedown: rp.move
                    },
                    style: {
                        width: function () {
                            return rp.out.width() + "px";
                        },
                        height: function () {
                            return rp.out.height() + "px";
                        }
                    },
                    children: [
                        index_1.svg({
                            type: "rect",
                            style: {
                                background: "gray",
                                opacity: "0.1"
                            },
                            attr: {
                                width: function () {
                                    return rp.out.width();
                                },
                                height: function () {
                                    return rp.out.height();
                                }
                            }
                        }),
                        modelChildren_1.modelChildren(model, function (me, row, index) {
                            var color = "red";
                            var diff = 20;
                            var lines = [];
                            if (row % 10 == 0) {
                                color = "black";
                                diff = diff + 20;
                                lines.push({
                                    type: "text",
                                    attr: {
                                        y: row * param.bit,
                                        x: function () {
                                            return rp.out.width() / 2 + diff + 10;
                                        }
                                    },
                                    text: row + ""
                                });
                                lines.push({
                                    type: "text",
                                    attr: {
                                        y: row * param.bit,
                                        x: function () {
                                            return rp.out.width() / 2 - diff - 10;
                                        }
                                    },
                                    text: row + ""
                                });
                            }
                            else if (row % 5 == 0) {
                                color = "orange";
                                diff = diff + 10;
                            }
                            lines.push({
                                type: "line",
                                style: {
                                    "stroke": color,
                                    "stroke-width": "1"
                                },
                                attr: {
                                    y1: row * param.bit,
                                    x1: function () {
                                        return rp.out.width() / 2 - diff;
                                    },
                                    y2: row * param.bit,
                                    x2: function () {
                                        return rp.out.width() / 2 + diff;
                                    }
                                }
                            });
                            return lines.map(index_1.svg);
                        })
                    ]
                })
            };
        });
    }
    exports.vRuler = vRuler;
});
