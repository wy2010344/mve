define(["require", "exports", "./view", "../mve/index", "./label", "./button", "./list"], function (require, exports, view_1, index_1, label_1, button_1, list_1) {
    "use strict";
    exports.__esModule = true;
    function getAllBuilder() {
        return allBuilder;
    }
    var allParse = index_1.parseOf(function (me, child) {
        var builder = allBuilder[child.type];
        if (builder) {
            return builder.view(me, child);
        }
        else {
            throw "\u5C1A\u4E0D\u652F\u6301\u7684type" + child.type;
        }
    });
    var allBuilder;
    (function (allBuilder) {
        allBuilder.view = view_1.viewBuilder(getAllBuilder, allParse);
        allBuilder.label = label_1.labelBuilder(getAllBuilder, allParse);
        allBuilder.button = button_1.buttonBuilder(getAllBuilder, allParse);
        allBuilder.list = list_1.listBuilder(getAllBuilder, allParse);
    })(allBuilder = exports.allBuilder || (exports.allBuilder = {}));
});
