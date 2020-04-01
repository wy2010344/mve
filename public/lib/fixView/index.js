define(["require", "exports", "./view", "./label", "../mve/index", "./input", "./button", "./scroll"], function (require, exports, view_1, label_1, index_1, input_1, button_1, scroll_1) {
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
        allBuilder.input = input_1.inputBuilder(getAllBuilder, allParse);
        allBuilder.button = button_1.buttonBuilder(getAllBuilder, allParse);
        allBuilder.scroll = scroll_1.scrollBuilder(getAllBuilder, allParse);
    })(allBuilder = exports.allBuilder || (exports.allBuilder = {}));
});
