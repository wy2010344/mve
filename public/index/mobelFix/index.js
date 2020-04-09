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
define(["require", "exports", "../../lib/baseView/mveUtil", "../../lib/mve/util", "../../lib/baseView/arraymodel", "../../lib/baseView/index", "../../lib/baseView/Layout"], function (require, exports, mveUtil_1, util_1, arraymodel_1, index_1, Layout_1) {
    "use strict";
    var me = new mveUtil_1.MveUtil();
    var width = util_1.mve.valueOf(0);
    var height = util_1.mve.valueOf(0);
    var element = document.createElement("div");
    element.style.background = "gray";
    var navigation = new arraymodel_1.SuperView(new index_1.BView());
    Layout_1.sameWidth(me, navigation);
    Layout_1.sameHeight(me, navigation);
    element.appendChild(navigation.view.getElement());
    navigation.w(320);
    navigation.h(640);
    me.WatchAfter(width, function (w) {
        navigation.x((w - navigation.w()) / 2);
    });
    me.WatchAfter(height, function (h) {
        navigation.y((h - navigation.h()) / 2);
    });
    var 首页 = /** @class */ (function (_super) {
        __extends(首页, _super);
        function 首页(navigation) {
            var _this = this;
            var view = new index_1.BView();
            _this = _super.call(this, view) || this;
            _this.navigation = navigation;
            view.setBackground("yellow");
            return _this;
        }
        return 首页;
    }(arraymodel_1.SubView));
    return {
        out: {
            width: width, height: height
        },
        element: element,
        init: function () {
            navigation.push(new 首页(navigation));
        },
        destroy: function () {
            navigation.destroy();
            me.destroy();
        }
    };
});
