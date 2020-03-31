define(["require", "exports", "./onceLife", "./util"], function (require, exports, onceLife_1, util_1) {
    "use strict";
    exports.__esModule = true;
    var ViewModel = /** @class */ (function () {
        function ViewModel(index, life, element, result) {
            this.index = index;
            this.life = life;
            this.element = element;
            this.result = result;
        }
        ViewModel.prototype.init = function () {
            this.result.init();
        };
        ViewModel.prototype.destroy = function () {
            this.life.destroy();
            this.result.destroy();
        };
        return ViewModel;
    }());
    exports.ViewModel = ViewModel;
    function modelChildren(model, fun) {
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
                    model.removeView(theView);
                    views.length = 0;
                }
            });
            var theView = {
                insert: function (index, row) {
                    var vindex = util_1.mve.valueOf(index);
                    var lifeModel = util_1.mve.newLifeModel();
                    var cs = fun(lifeModel.me, row, vindex);
                    //创建视图
                    var vm = parent.newChildAt(index);
                    var vx = mx.buildChildren(lifeModel.me, cs, vm);
                    var view = new ViewModel(vindex, lifeModel, vm, vx);
                    //模型增加
                    views.splice(index, 0, view);
                    //更新计数
                    for (var i = index + 1; i < views.length; i++) {
                        views[i].index(i);
                    }
                    //初始化
                    if (life.isInit) {
                        view.init();
                    }
                },
                remove: function (index) {
                    //模型减少
                    var view = views.splice(index, 1)[0];
                    if (view) {
                        //视图减少
                        parent.remove(index);
                        //更新计数
                        for (var i = index; i < views.length; i++) {
                            views[i].index(i);
                        }
                        //销毁
                        if (life.isInit) {
                            view.destroy();
                        }
                    }
                },
                move: function (oldIndex, newIndex) {
                    var view = views[oldIndex];
                    //模型变更
                    views.splice(oldIndex, 1);
                    views.splice(newIndex, 0, view);
                    //视图变更
                    parent.move(oldIndex, newIndex);
                    //更新计数
                    var sort = oldIndex < newIndex ? [oldIndex, newIndex] : [newIndex, oldIndex];
                    for (var i = sort[0]; i <= sort[1]; i++) {
                        views[i].index(i);
                    }
                }
            };
            model.addView(theView);
            return life;
        };
    }
    exports.modelChildren = modelChildren;
});
