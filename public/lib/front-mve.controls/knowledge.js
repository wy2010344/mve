define(["require", "exports", "../mve/childrenBuilder", "./window/form"], function (require, exports, childrenBuilder_1, form_1) {
    "use strict";
    return form_1.topTitleResizeForm(function (me, p, r) {
        var article = childrenBuilder_1.newArticle()
            .append("");
        return {
            title: "mve知识",
            element: {
                type: "div",
                children: article.out
            }
        };
    });
});
