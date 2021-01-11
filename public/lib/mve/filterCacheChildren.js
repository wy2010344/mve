define(["require", "exports", "./util"], function (require, exports, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.filterCacheChildren = void 0;
    var CacheViewModel = /** @class */ (function () {
        function CacheViewModel(row, life, result) {
            this.row = row;
            this.life = life;
            this.result = result;
        }
        CacheViewModel.prototype.init = function () {
            util_1.orInit(this.result);
        };
        CacheViewModel.prototype.destroy = function () {
            this.life.destroy();
            util_1.orDestroy(this.result);
        };
        return CacheViewModel;
    }());
    function filterCacheChildren(array, fun) {
        return function (buildChildren, parent) {
            var views = [];
            var life = util_1.onceLife({
                init: function () {
                    var size = views.size();
                    for (var i = 0; i < size; i++) {
                        views.get(i).init();
                    }
                },
                destroy: function () {
                    var size = views.size();
                    for (var i = size - 1; i > -1; i--) {
                        views.get(i).destroy();
                    }
                    views.length = 0;
                    w.disable();
                }
            });
            var w = util_1.mve.WatchAfter(array, function (vs) {
                if (vs.length < views.length) {
                    //更新旧数据视图
                    for (var i = 0; i < vs.length; i++) {
                        views[i].row(vs[i]);
                    }
                    var minLength = vs.length - 1;
                    for (var i = views.length - 1; i > minLength; i--) {
                        //删除视图
                        parent.remove(i);
                        //销毁
                        if (life.isInit) {
                            views[i].destroy();
                        }
                    }
                    views.length = vs.length;
                }
                else {
                    //更新旧数据
                    for (var i = 0; i < views.length; i++) {
                        views[i].row(vs[i]);
                    }
                    //追加新数据
                    for (var i = views.length; i < vs.length; i++) {
                        var row = util_1.mve.valueOf(vs[i]);
                        var lifeModel = util_1.mve.newLifeModel();
                        var cs = fun(lifeModel.me, row, i);
                        //创建视图
                        var vm = parent.newChildAt(i);
                        var vx = buildChildren(lifeModel.me, cs, vm);
                        var cv = new CacheViewModel(row, lifeModel, vx);
                        //模型增加
                        views.push(cv);
                        //初始化
                        if (life.isInit) {
                            cv.init();
                        }
                    }
                }
            });
            return life.out;
        };
    }
    exports.filterCacheChildren = filterCacheChildren;
});
