define(["require", "exports", "../index", "../../mve/util"], function (require, exports, index_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.modelChildren = void 0;
    var ViewModel = /** @class */ (function () {
        function ViewModel(index, param, element, result) {
            this.index = index;
            this.param = param;
            this.element = element;
            this.result = result;
        }
        ViewModel.prototype.destroy = function () {
            this.param.destroy();
            this.result.destroy();
        };
        return ViewModel;
    }());
    function modelChildren(model, fun) {
        return function (mx, parent) {
            var views = [];
            var theView = {
                insert: function (index, row) {
                    var vindex = util_1.mve.valueOf(index);
                    var param = new index_1.BParamImpl();
                    var cs = fun(param, row, vindex);
                    var vm = parent.newChildAt(index);
                    var vx = mx.buildChildren(param, cs, vm);
                    var view = new ViewModel(vindex, param, vm, vx);
                    views.splice(index, 0, view);
                    for (var i = index + 1; i < views.length; i++) {
                        views[i].index(i);
                    }
                },
                remove: function (index) {
                    var view = views.splice(index, 1)[0];
                    if (view) {
                        parent.remove(index);
                        for (var i = index; i < views.length; i++) {
                            views[i].index(i);
                        }
                        view.destroy();
                    }
                },
                move: function (oldIndex, newIndex) {
                    var view = views[oldIndex];
                    views.splice(oldIndex, 1);
                    views.splice(newIndex, 0, view);
                    parent.move(oldIndex, newIndex);
                    var sort = oldIndex < newIndex ? [oldIndex, newIndex] : [newIndex, oldIndex];
                    for (var i = sort[0]; i <= sort[1]; i++) {
                        views[i].index(i);
                    }
                }
            };
            model.addView(theView);
            return {
                destroy: function () {
                    for (var i = 0; i < views.length; i++) {
                        views[i].destroy();
                    }
                    model.removeView(theView);
                    views.length = 0;
                }
            };
        };
    }
    exports.modelChildren = modelChildren;
});
