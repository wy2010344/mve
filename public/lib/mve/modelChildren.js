define(["require", "exports", "./childrenBuilder", "./util"], function (require, exports, childrenBuilder_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.modelCacheChildrenReverse = exports.modelCacheChildren = exports.modelChildrenReverse = exports.modelChildren = exports.modelCacheReverse = exports.modelCache = exports.moveUpdateIndexReverse = exports.removeUpdateIndexReverse = exports.initUpdateIndexReverse = exports.moveUpdateIndex = exports.removeUpdateIndex = exports.initUpdateIndex = void 0;
    /**
     * 初始化更新计数
     * @param views
     * @param index
     */
    function initUpdateIndex(views, index) {
        for (var i = index + 1; i < views.size(); i++) {
            views.get(i).index(i);
        }
    }
    exports.initUpdateIndex = initUpdateIndex;
    /**
     * 删除时更新计算
     * @param views
     * @param index
     */
    function removeUpdateIndex(views, index) {
        for (var i = index; i < views.size(); i++) {
            views.get(i).index(i);
        }
    }
    exports.removeUpdateIndex = removeUpdateIndex;
    /**
     * 移动时更新计数
     * @param views
     * @param oldIndex
     * @param newIndex
     */
    function moveUpdateIndex(views, oldIndex, newIndex) {
        var sort = oldIndex < newIndex ? [oldIndex, newIndex] : [newIndex, oldIndex];
        for (var i = sort[0]; i <= sort[1]; i++) {
            views.get(i).index(i);
        }
    }
    exports.moveUpdateIndex = moveUpdateIndex;
    /**
     * 初始化更新计数
     * @param views
     * @param index
     */
    function initUpdateIndexReverse(views, index) {
        var s = views.size() - 1;
        for (var i = index; i > -1; i--) {
            views.get(i).index(s - i);
        }
    }
    exports.initUpdateIndexReverse = initUpdateIndexReverse;
    /**
     * 删除时更新计算
     * @param views
     * @param index
     */
    function removeUpdateIndexReverse(views, index) {
        var s = views.size() - 1;
        for (var i = index - 1; i > -1; i--) {
            views.get(i).index(s - i);
        }
    }
    exports.removeUpdateIndexReverse = removeUpdateIndexReverse;
    /**
     * 移动时更新计数
     * @param views
     * @param oldIndex
     * @param newIndex
     */
    function moveUpdateIndexReverse(views, oldIndex, newIndex) {
        var sort = oldIndex < newIndex ? [oldIndex, newIndex] : [newIndex, oldIndex];
        var s = views.size() - 1;
        for (var i = sort[0]; i <= sort[1]; i++) {
            views.get(i).index(s - i);
        }
    }
    exports.moveUpdateIndexReverse = moveUpdateIndexReverse;
    /**
     * 最终的卸载
     * @param views
     * @param model
     * @param theView
     */
    function destroyViews(views, model, theView) {
        var size = views.size();
        for (var i = size - 1; i > -1; i--) {
            views.get(i).destroy();
        }
        model.removeView(theView);
        views.clear();
    }
    /**
     * 最终的卸载
     * @param views
     * @param model
     * @param theView
     */
    function destroyViewsReverse(views, model, theView) {
        var size = views.size();
        for (var i = 0; i < size; i++) {
            views.get(i).destroy();
        }
        model.removeView(theView);
        views.clear();
    }
    function getCacheModel(pDestroy) {
        var CacheModel = /** @class */ (function () {
            function CacheModel(index, value) {
                this.index = index;
                this.value = value;
            }
            CacheModel.prototype.destroy = function () { };
            return CacheModel;
        }());
        if (pDestroy) {
            CacheModel.prototype.destroy = function () {
                pDestroy(this.value);
            };
        }
        return function (index, value) {
            return new CacheModel(index, value);
        };
    }
    function buildModelCacheView(insert, destroy) {
        var cacheModel = getCacheModel(destroy);
        return function (index, row) {
            var vindex = util_1.mve.valueOf(index);
            var vrow = insert(row, vindex);
            return cacheModel(vindex, vrow);
        };
    }
    function superModelCache(views, model, getView) {
        var theView = {
            insert: function (index, row) {
                var view = getView(index, row);
                views.insert(index, view);
                //更新计数
                initUpdateIndex(views, index);
            },
            remove: function (index) {
                //模型减少
                var view = views.get(index);
                views.remove(index);
                if (view) {
                    //更新计数
                    removeUpdateIndex(views, index);
                    view.destroy();
                }
            },
            set: function (index, row) {
                var view = getView(index, row);
                var oldView = views.set(index, view);
                oldView.destroy();
            },
            move: function (oldIndex, newIndex) {
                //模型变更
                views.move(oldIndex, newIndex);
                //更新计数
                moveUpdateIndex(views, oldIndex, newIndex);
            }
        };
        model.addView(theView);
        return function () {
            destroyViews(views, model, theView);
        };
    }
    function superModelCacheReverse(views, model, getView) {
        var theView = {
            insert: function (index, row) {
                index = views.size() - index;
                var view = getView(index, row);
                views.insert(index, view);
                //更新计数
                initUpdateIndexReverse(views, index);
            },
            remove: function (index) {
                index = views.size() - 1 - index;
                //模型减少
                var view = views.get(index);
                views.remove(index);
                if (view) {
                    //更新计数
                    removeUpdateIndexReverse(views, index);
                    view.destroy();
                }
            },
            set: function (index, row) {
                var s = views.size() - 1;
                index = s - index;
                var view = getView(index, row);
                var oldView = views.set(index, view);
                oldView.destroy();
                view.index(s - index);
            },
            move: function (oldIndex, newIndex) {
                var s = views.size() - 1;
                oldIndex = s - oldIndex;
                newIndex = s - newIndex;
                //模型变更
                views.move(oldIndex, newIndex);
                //更新计数
                moveUpdateIndexReverse(views, oldIndex, newIndex);
            }
        };
        model.addView(theView);
        return function () {
            destroyViewsReverse(views, model, theView);
        };
    }
    /**
     * 从一个model到另一个model，可能有销毁事件
     * 应该是很少用的，尽量不用
     * 可以直接用CacheArrayModel<T>作为组件基础参数，在组件需要的字段不存在时，入参定义T到该字段的映射
     * @param model
     * @param insert
     */
    function modelCache(model, insert, destroy) {
        var views = util_1.mve.arrayModelOf([]);
        var getView = buildModelCacheView(insert, destroy);
        return {
            views: views,
            destroy: superModelCache(views, model, getView)
        };
    }
    exports.modelCache = modelCache;
    /**
     * 从一个model到另一个model，可能有销毁事件
     * 应该是很少用的，尽量不用
     * 可以直接用CacheArrayModel<T>作为组件基础参数，在组件需要的字段不存在时，入参定义T到该字段的映射
     * @param model
     * @param insert
     */
    function modelCacheReverse(model, insert, destroy) {
        var views = util_1.mve.arrayModelOf([]);
        var getView = buildModelCacheView(insert, destroy);
        return {
            views: views,
            destroy: superModelCacheReverse(views, model, getView)
        };
    }
    exports.modelCacheReverse = modelCacheReverse;
    var ViewModel = /** @class */ (function () {
        function ViewModel(index, value, life, result) {
            this.index = index;
            this.value = value;
            this.life = life;
            this.result = result;
        }
        ViewModel.prototype.init = function () {
            util_1.orInit(this.result);
        };
        ViewModel.prototype.destroy = function () {
            this.life.destroy();
            util_1.orDestroy(this.result);
        };
        return ViewModel;
    }());
    function buildGetView(getElement, getData) {
        return function (index, row, parent, fun) {
            var vindex = util_1.mve.valueOf(index);
            var lifeModel = util_1.mve.newLifeModel();
            var cs = fun(lifeModel.me, row, vindex);
            //创建视图
            var vm = parent.newChildAt(index);
            var vx = childrenBuilder_1.baseChildrenBuilder(lifeModel.me, getElement(cs), vm);
            return new ViewModel(vindex, getData(cs), lifeModel, vx);
        };
    }
    function superModelChildren(views, model, fun, getView) {
        return function (parent, me) {
            var life = util_1.onceLife({
                init: function () {
                    var size = views.size();
                    for (var i = 0; i < size; i++) {
                        views.get(i).init();
                    }
                },
                destroy: function () {
                    destroyViews(views, model, theView);
                }
            });
            var theView = {
                insert: function (index, row) {
                    var view = getView(index, row, parent, fun);
                    //模型增加
                    views.insert(index, view);
                    //更新计数
                    initUpdateIndex(views, index);
                    //初始化
                    if (life.isInit) {
                        view.init();
                    }
                },
                remove: function (index) {
                    //模型减少
                    var view = views.get(index);
                    views.remove(index);
                    if (view) {
                        //销毁
                        if (life.isInit) {
                            view.destroy();
                        }
                        //更新计数
                        removeUpdateIndex(views, index);
                        //视图减少
                        parent.remove(index);
                    }
                },
                set: function (index, row) {
                    var view = getView(index, row, parent, fun);
                    var oldView = views.set(index, view);
                    if (life.isInit) {
                        view.init();
                        oldView.destroy();
                    }
                    parent.remove(index + 1);
                },
                move: function (oldIndex, newIndex) {
                    //模型变更
                    views.move(oldIndex, newIndex);
                    //视图变更
                    parent.move(oldIndex, newIndex);
                    //更新计数
                    moveUpdateIndex(views, oldIndex, newIndex);
                }
            };
            model.addView(theView);
            return life.out;
        };
    }
    function superModelChildrenReverse(views, model, fun, getView) {
        return function (parent, me) {
            var life = util_1.onceLife({
                init: function () {
                    var size = views.size();
                    for (var i = size - 1; i > -1; i--) {
                        views.get(i).init();
                    }
                },
                destroy: function () {
                    destroyViewsReverse(views, model, theView);
                }
            });
            var theView = {
                insert: function (index, row) {
                    index = views.size() - index;
                    var view = getView(index, row, parent, fun);
                    //模型增加
                    views.insert(index, view);
                    //更新计数
                    initUpdateIndexReverse(views, index);
                    //初始化
                    if (life.isInit) {
                        view.init();
                    }
                },
                remove: function (index) {
                    index = views.size() - 1 - index;
                    //模型减少
                    var view = views.get(index);
                    views.remove(index);
                    if (view) {
                        //销毁
                        if (life.isInit) {
                            view.destroy();
                        }
                        //更新计数
                        removeUpdateIndexReverse(views, index);
                        //视图减少
                        parent.remove(index);
                    }
                },
                set: function (index, row) {
                    var s = views.size() - 1;
                    index = s - index;
                    var view = getView(index, row, parent, fun);
                    var oldView = views.set(index, view);
                    if (life.isInit) {
                        view.init();
                        oldView.destroy();
                    }
                    view.index(s - index);
                    parent.remove(index + 1);
                },
                move: function (oldIndex, newIndex) {
                    var s = views.size() - 1;
                    oldIndex = s - oldIndex;
                    newIndex = s - newIndex;
                    //模型变更
                    views.move(oldIndex, newIndex);
                    //视图变更
                    parent.move(oldIndex, newIndex);
                    //更新计数
                    moveUpdateIndexReverse(views, oldIndex, newIndex);
                }
            };
            model.addView(theView);
            return life.out;
        };
    }
    ////////////////////////////////////////////通用方式////////////////////////////////////////////////
    var modelChildrenGetView = buildGetView(function (v) { return v; }, function () { return null; });
    /**
     * 从model到视图
     * @param model
     * @param fun
     */
    function modelChildren(model, fun) {
        return superModelChildren([], model, fun, modelChildrenGetView);
    }
    exports.modelChildren = modelChildren;
    /**
     * 从model到视图
     * @param model
     * @param fun
     */
    function modelChildrenReverse(model, fun) {
        return superModelChildrenReverse([], model, fun, modelChildrenGetView);
    }
    exports.modelChildrenReverse = modelChildrenReverse;
    function renderGetElement(v) {
        return v.element;
    }
    function renderGetData(v) {
        return v.data;
    }
    var modelCacheChildrenGetView = buildGetView(renderGetElement, renderGetData);
    /**
     * 从model到带模型视图
     * 应该是很少用的，尽量不用
     * @param model
     * @param fun
     */
    function modelCacheChildren(model, fun) {
        var views = util_1.mve.arrayModelOf([]);
        return {
            views: views,
            children: superModelChildren(views, model, fun, modelCacheChildrenGetView)
        };
    }
    exports.modelCacheChildren = modelCacheChildren;
    /**
     * 从model到带模型视图
     * 应该是很少用的，尽量不用
     * @param model
     * @param fun
     */
    function modelCacheChildrenReverse(model, fun) {
        var views = util_1.mve.arrayModelOf([]);
        return {
            views: views,
            children: superModelChildrenReverse(views, model, fun, modelCacheChildrenGetView)
        };
    }
    exports.modelCacheChildrenReverse = modelCacheChildrenReverse;
});
