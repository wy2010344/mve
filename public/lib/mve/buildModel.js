define(["require", "exports"], function (require, exports) {
    "use strict";
    ;
    return function (p) {
        var views = [];
        var view = {
            insert: function (index, row) {
                //动态加载
                var view = p.build(row, index);
                views.splice(index, 0, view);
                for (var i = index + 1; i < views.length; i++) {
                    p.update_index(views[i], i);
                }
                if (index < views.length - 1) {
                    /*移动到前面*/
                    p.insertChildBefore(view, views[index + 1]);
                }
                else {
                    p.appendChild(view);
                }
                p.init(view);
            },
            remove: function (index) {
                //动态删除
                var view = views[index];
                views.splice(index, 1);
                for (var i = index; i < views.length; i++) {
                    p.update_index(views[i], i);
                }
                p.destroy(view);
                p.removeChild(view);
            },
            move: function (old_index, new_index) {
                var view = views[old_index];
                views.splice(old_index, 1);
                views.splice(new_index, 0, view);
                var sort = old_index < new_index ? [old_index, new_index] : [new_index, old_index];
                for (var i = sort[0]; i <= sort[1]; i++) {
                    p.update_index(views[i], i);
                }
                if (new_index < views.length - 1) {
                    p.insertChildBefore(view, views[new_index + 1], true);
                }
                else {
                    p.appendChild(view, true);
                }
            }
        };
        p.model.addView(view);
        var initViews = [];
        for (var i = 0; i < p.model.size(); i++) {
            var row = p.model.get(i);
            var view_1 = p.build(row, i);
            views.push(view_1);
            p.appendChild(view_1);
            initViews.push(view_1);
        }
        return {
            firstElement: function () {
                var view = views[0];
                if (view) {
                    return view.obj.element;
                }
            },
            init: function () {
                mb.Array.forEach(initViews, p.init);
            },
            destroy: function () {
                mb.Array.forEach(views, p.destroy);
                p.model.removeView(view);
            }
        };
    };
});
