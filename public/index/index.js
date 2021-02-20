define(["require", "exports", "../lib/front-mve.controls/window/index", "../lib/mve/modelChildren"], function (require, exports, index_1, modelChildren_1) {
    "use strict";
    return index_1.DesktopIndex(function (p) {
        return {
            type: "div",
            init: function () {
                new Promise(function (resolve_1, reject_1) { require(["./index/首页"], resolve_1, reject_1); }).then(function (index) {
                    p.model.push(index.panel);
                });
            },
            style: {
                width: function () {
                    return p.width() + "px";
                },
                height: function () {
                    return p.height() + "px";
                }
            },
            children: modelChildren_1.modelChildren(p.model, function (me, row, index) {
                return row.render(me, p, index);
            })
        };
    });
});
