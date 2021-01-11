define(["require", "exports", "./view", "../mve/index", "./label", "./button", "./list", "./grid", "./stack"], function (require, exports, view_1, index_1, label_1, button_1, list_1, grid_1, stack_1) {
    "use strict";
    exports.__esModule = true;
    exports.allBuilder = void 0;
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
        allBuilder.scrollList = list_1.scrollListBuilder(getAllBuilder, allParse);
        allBuilder.listItem = list_1.listItemBuilder(getAllBuilder, allParse);
        allBuilder.grid = grid_1.gridBuilder(getAllBuilder, allParse);
        allBuilder.stack = stack_1.stackBuilder(getAllBuilder, allParse);
    })(allBuilder = exports.allBuilder || (exports.allBuilder = {}));
});
