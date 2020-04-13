var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "../../lib/mve/util", "../../lib/baseView/index", "../../lib/baseView/arraymodel", "../../lib/baseView/BNavigationView", "../../lib/baseView/mveFix/index"], function (require, exports, util_1, index_1, arraymodel_1, BNavigationView_1, index_2) {
    "use strict";
    var me = new arraymodel_1.BParamImpl();
    var out = {
        width: util_1.mve.valueOf(0),
        height: util_1.mve.valueOf(0)
    };
    var element = document.createElement("div");
    var view = new index_1.BView();
    view.setBackground("yellow");
    var MainNavigation = /** @class */ (function (_super) {
        __extends(MainNavigation, _super);
        function MainNavigation() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MainNavigation.prototype.getHeight = function () {
            return 640;
        };
        MainNavigation.prototype.getWidth = function () {
            return 320;
        };
        return MainNavigation;
    }(BNavigationView_1.BNavigationViewSuper));
    var navigation = new MainNavigation(me, view);
    element.style.background = "gray";
    me.Watch(function () {
        view.kSetX((out.width() - navigation.getWidth()) / 2);
    });
    me.Watch(function () {
        view.kSetY((out.height() - navigation.getHeight()) / 2);
    });
    var cellHeight = util_1.mve.valueOf(0);
    var result = index_2.allBuilder.view.view(me, {
        type: "view",
        x: 0,
        y: 0,
        w: 320,
        h: 640,
        children: [
            {
                type: "label",
                x: 0,
                y: 0,
                w: 320,
                h: 40,
                background: "red",
                text: "点击"
            },
            {
                type: "button",
                x: 0,
                y: 40,
                w: 320,
                h: 40,
                background: "gray",
                text: "点击",
                click: function () {
                    mb.log("点击");
                    cellHeight(cellHeight() + 10);
                }
            },
            {
                type: "list",
                x: 0,
                y: 80,
                w: 320,
                children: [
                    {
                        height: 40,
                        children: [
                            {
                                type: "view",
                                x: 0, y: 0, w: 200, h: 20,
                                background: "gray"
                            }
                        ]
                    },
                    {
                        height: function () {
                            return cellHeight();
                        },
                        children: [
                            {
                                type: "view",
                                x: 0, y: 0, w: 200, h: 20,
                                background: "blue"
                            }
                        ]
                    }
                ]
            }
        ]
    });
    element.appendChild(view.getElement());
    return {
        out: out,
        element: element,
        init: function () {
            mb.log("初始化");
            navigation.push(function (index) {
                return {
                    view: result.element
                };
            });
        },
        destroy: function () {
            result.destroy();
            me.destroy();
        }
    };
});
