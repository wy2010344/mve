define(["require", "exports", "../../mve/v2/index", "./div", "./ul", "./span"], function (require, exports, index_1, div_1, ul_1, span_1) {
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
    var allBuilder = {
        div: div_1.divBuilder(getAllBuilder, allParse),
        ul: ul_1.ulBuilder(getAllBuilder, allParse),
        span: span_1.spanBuilder(getAllBuilder, allParse)
    };
});
