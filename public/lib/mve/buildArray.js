define(["require", "exports"], function (require, exports) {
    "use strict";
    return function (p) {
        var views = []; //在界面上的缓存池
        var update_views = function (array) {
            //更新视图上数据
            for (var i = 0; i < views.length; i++) {
                p.update_data(views[i], array[i]);
            }
        };
        if (p.no_cache) {
            return {
                destroy: function () {
                    mb.Array.forEach(views, p.destroy);
                },
                after: function (array) {
                    if (array.length < views.length) {
                        while (views.length != array.length) {
                            var view = views.pop();
                            p.removeChild(view);
                            p.destroy(view);
                        }
                        update_views(array);
                    }
                    else {
                        update_views(array);
                        for (var i = views.length; i < array.length; i++) {
                            var view = p.build(array[i], i);
                            views.push(view);
                            p.appendChild(view);
                            p.after(view);
                        }
                    }
                }
            };
        }
        else {
            var caches_1 = []; //缓存池
            return {
                firstElement: function () {
                    var view = views[0];
                    if (view) {
                        return view.obj.element;
                    }
                },
                destroy: function () {
                    mb.Array.forEach(caches_1, p.destroy);
                },
                after: function (array) {
                    /**
                     * 既然以数组序号，没必要清空所有
                     */
                    if (array.length < views.length) {
                        //从视图上移除
                        while (views.length != array.length) {
                            var view = views.pop();
                            p.removeChild(view);
                        }
                        update_views(array);
                    }
                    else {
                        //向视图上增加，>
                        if (array.length < caches_1.length) {
                            //caches向视图上增加
                            for (var i = views.length; i < array.length; i++) {
                                var view = caches_1[i];
                                views.push(view);
                                p.appendChild(view);
                            }
                            update_views(array);
                        }
                        else {
                            //从caches向视图上增加的部分
                            for (var i = views.length; i < caches_1.length; i++) {
                                var view = caches_1[i];
                                views.push(view);
                                p.appendChild(view);
                            }
                            //更新caches的数据
                            update_views(array);
                            //新增加，同时增加进caches和views
                            for (var i = caches_1.length; i < array.length; i++) {
                                var view = p.build(array[i], i);
                                caches_1.push(view);
                                views.push(view);
                                p.appendChild(view);
                                p.after(view);
                            }
                        }
                    }
                }
            };
        }
    };
});
