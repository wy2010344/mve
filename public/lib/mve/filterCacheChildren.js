define(["require", "exports", "./onceLife", "./util"], function (require, exports, onceLife_1, util_1) {
    "use strict";
    exports.__esModule = true;
    var CacheViewModel = /** @class */ (function () {
        function CacheViewModel(row, life, element, result) {
            this.row = row;
            this.life = life;
            this.element = element;
            this.result = result;
        }
        CacheViewModel.prototype.init = function () {
            this.result.init();
        };
        CacheViewModel.prototype.destroy = function () {
            this.life.destroy();
            this.result.destroy();
        };
        return CacheViewModel;
    }());
    function filterCacheChildren(array, fun) {
        return function (mx, parent) {
            var views = [];
            var life = onceLife_1.onceLife({
                init: function () {
                    for (var i = 0; i < views.length; i++) {
                        views[i].init();
                    }
                },
                destroy: function () {
                    for (var i = 0; i < views.length; i++) {
                        views[i].destroy();
                    }
                    views.length = 0;
                    w.disable();
                }
            });
            var w = util_1.mve.WatchAfter(function () {
                return array();
            }, function (vs) {
                if (vs.length < views.length) {
                    //更新旧数据视图
                    for (var i = 0; i < vs.length; i++) {
                        views[i].row(vs[i]);
                    }
                    for (var i = views.length; i > vs.length; i--) {
                        //删除视图
                        parent.remove(i - 1);
                        //销毁
                        if (life.isInit) {
                            views[i - 1].destroy();
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
                        var vx = mx.buildChildren(lifeModel.me, cs, vm);
                        var cv = new CacheViewModel(row, lifeModel, vm, vx);
                        //模型增加
                        views.push(cv);
                        //初始化
                        if (life.isInit) {
                            cv.init();
                        }
                    }
                }
            });
            return life;
        };
    }
    exports.filterCacheChildren = filterCacheChildren;
});
