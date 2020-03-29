define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    function buildArray(p) {
        var views = [];
        return {
            firstElement: function () {
                var view = views[0];
                if (view) {
                    return view.obj.firstElement();
                }
            },
            views: views,
            destroy: function () {
                mb.Array.forEach(views, p.destroy);
                views.length = 0;
            },
            reset: function (array) {
                for (var i = 0; i < views.length; i++) {
                    p.destroy(views[i]);
                }
                views.length = 0;
                for (var i = 0; i < array.length; i++) {
                    var view = p.build(array[i], i);
                    views.push(view);
                    p.appendChild(view);
                    p.init(view);
                }
            }
        };
    }
    exports.buildArray = buildArray;
});
