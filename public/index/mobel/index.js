define(["require", "exports", "../../lib/fixView/index", "../../lib/mve/util", "./main"], function (require, exports, index_1, util_1, main_1) {
    "use strict";
    return index_1.allBuilder.view.mve(function (me) {
        var width = util_1.mve.valueOf(0);
        var height = util_1.mve.valueOf(0);
        var size = {
            width: util_1.mve.valueOf(320),
            height: util_1.mve.valueOf(640)
        };
        return {
            out: {
                width: width, height: height
            },
            init: function () { }, destroy: function () { },
            element: {
                type: "view",
                x: 0, y: 0, h: 0, w: 0,
                children: [
                    {
                        type: "view",
                        w: size.width,
                        h: size.height,
                        x: function () {
                            return (width() - size.width()) / 2;
                        },
                        y: function () {
                            return (height() - size.height()) / 2;
                        },
                        background: "gray",
                        children: [
                            main_1.main(size.width, size.height)
                        ]
                    }
                ]
            }
        };
    });
});
