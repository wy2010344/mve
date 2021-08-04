define(["require", "exports", "./childrenBuilder", "./util"], function (require, exports, childrenBuilder_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.modelCacheChildren = exports.modelChildren = exports.modelCache = exports.moveUpdateIndex = exports.removeUpdateIndex = exports.initUpdateIndex = void 0;
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
    function superModelCache(views, model, insert, destroy) {
        var cacheModel = getCacheModel(destroy);
        var theView = {
            insert: function (index, row) {
                var vindex = util_1.mve.valueOf(index);
                var vrow = insert(row, vindex);
                views.insert(index, cacheModel(vindex, vrow));
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
    /**
     * 从一个model到另一个model，可能有销毁事件
     * 应该是很少用的，尽量不用
     * 可以直接用CacheArrayModel<T>作为组件基础参数，在组件需要的字段不存在时，入参定义T到该字段的映射
     * @param model
     * @param insert
     */
    function modelCache(model, insert, destroy) {
        var views = util_1.mve.arrayModelOf([]);
        return {
            views: views,
            destroy: superModelCache(views, model, insert, destroy)
        };
    }
    exports.modelCache = modelCache;
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
    function superModelChildren(views, getElement, getData, model, fun) {
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
                    var vindex = util_1.mve.valueOf(index);
                    var lifeModel = util_1.mve.newLifeModel();
                    var cs = fun(lifeModel.me, row, vindex);
                    //创建视图
                    var vm = parent.newChildAt(index);
                    var vx = childrenBuilder_1.baseChildrenBuilder(lifeModel.me, getElement(cs), vm);
                    var view = new ViewModel(vindex, getData(cs), lifeModel, vx);
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
                        //视图减少
                        parent.remove(index);
                        //更新计数
                        removeUpdateIndex(views, index);
                        //销毁
                        if (life.isInit) {
                            view.destroy();
                        }
                    }
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
    ////////////////////////////////////////////通用方式////////////////////////////////////////////////
    function emptyGet() { }
    function quoteGet(v) { return v; }
    /**
     * 从model到视图
     * @param model
     * @param fun
     */
    function modelChildren(model, fun) {
        return superModelChildren([], quoteGet, emptyGet, model, fun);
    }
    exports.modelChildren = modelChildren;
    function renderGetElement(v) {
        return v.element;
    }
    function renderGetData(v) {
        return v.data;
    }
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
            children: superModelChildren(views, renderGetElement, renderGetData, model, fun)
        };
    }
    exports.modelCacheChildren = modelCacheChildren;
});
