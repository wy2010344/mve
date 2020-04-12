define(["require", "exports", "../../lib/baseView/mveUtil", "../../lib/mve/util", "../../lib/baseView/BNavigationView", "../../lib/baseView/index"], function (require, exports, mveUtil_1, util_1, BNavigationView_1, index_1) {
    "use strict";
    var me = new mveUtil_1.MveUtil();
    var out = {
        width: util_1.mve.valueOf(0),
        height: util_1.mve.valueOf(0)
    };
    var element = document.createElement("div");
    var view = new index_1.BView();
    view.setBackground("yellow");
    var navigation = BNavigationView_1.navigationOf(me, {
        view: view,
        width: function () {
            return 320;
        },
        height: function () {
            return 640;
        }
    });
    element.style.background = "gray";
    me.Watch(function () {
        view.setX((out.width() - navigation.width()) / 2);
    });
    me.Watch(function () {
        view.setY((out.height() - navigation.height()) / 2);
    });
    element.appendChild(view.getElement());
    return {
        out: out,
        element: element,
        init: function () {
            mb.log("初始化");
            navigation.push(function (index) {
                return {
                    view: new index_1.BView()
                };
            });
        },
        destroy: function () {
            me.destroy();
        }
    };
});
