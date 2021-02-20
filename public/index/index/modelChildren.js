define(["require", "exports", "../../lib/front-mve.controls/window/form", "../../lib/mve-DOM/index", "../../lib/mve/childrenBuilder"], function (require, exports, form_1, index_1, childrenBuilder_1) {
    "use strict";
    return form_1.topTitleResizeForm(function (me, p, r) {
        var article = childrenBuilder_1.newArticle()
            .append("modelChildren\u662F\u91CD\u590D\u5B50\u5143\u7D20\uFF0C\u5B9A\u4E49\u5728lib/mve/modelChildren.ts")
            .append(index_1.newline)
            .append("\u5B83\u63A5\u6536\u4E24\u4E2A\u53C2\u6570\uFF0C\u4E00\u4E2A\u662F\u5217\u8868\u6A21\u578Bmve.ArrayModel\uFF0C\u53E6\u4E00\u4E2A\u662F\u5C06\u5217\u8868\u6A21\u578B\u7684\u6BCF\u4E00\u4E2A\u5143\u7D20\u8F6C\u5316\u6210JOChildren\u7C7B\u578B\uFF0C\u5927\u81F4\u76F8\u5F53\u4E8E\u5C06\u6A21\u578B\u8F6C\u5316\u6210\u89C6\u56FE")
            .append(index_1.newline)
            .append("mve.ArrayModel\u662F\u53EF\u89C2\u5BDF\u7684\u5217\u8868\uFF0C\u9664\u4E86\u5355\u7EAF\u7684get\u65B9\u6CD5\u3002\u4F7F\u7528modelChildren\u4F7F\u6E32\u67D3\u51FA\u7684\u6BCF\u4E00\u4E2A\u89C6\u56FE\u7247\u6BB5\u4E0E\u6A21\u578B\u4E00\u4E00\u5BF9\u5E94")
            .append(index_1.newline)
            .append("\u5982\u679C\u8981\u4F7F\u7528filter\uFF0C\u6700\u597D\u5BF9\u89C6\u56FE\u5143\u7D20\u7684\u9876\u5C42display\u7ED1\u5B9A\u6A21\u578B\u7684\u67D0\u4E00\u4E2A\u53EF\u89C2\u5BDF\u5C5E\u6027\uFF0Cfilter\u5373\u904D\u5386\u5C06\u53EF\u7528\u7684\u8BB0\u5F55\u7684\u8BE5\u5C5E\u6027\u8BBE\u7F6E\u6210true\uFF0C\u5176\u4F59\u7684\u8BBE\u7F6E\u6210false");
        return {
            title: "modelChildren",
            element: {
                type: "div",
                children: article.out
            }
        };
    });
});
