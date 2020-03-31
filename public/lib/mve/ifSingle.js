define(["require", "exports", "./onceLife", "./util"], function (require, exports, onceLife_1, util_1) {
    "use strict";
    exports.__esModule = true;
    function ifSingle(fun) {
        return function (mx, p) {
            var currentObject;
            var currentLifeModel;
            var life = onceLife_1.onceLife({
                init: function () {
                    if (currentObject) {
                        currentObject.init();
                    }
                },
                destroy: function () {
                    w.disable();
                    if (currentObject) {
                        currentObject.destroy();
                    }
                    currentLifeModel.destroy();
                }
            });
            var w = util_1.mve.WatchExp(function () {
                if (currentLifeModel) {
                    currentLifeModel.destroy();
                }
                currentLifeModel = util_1.mve.newLifeModel();
            }, function () {
                return fun(currentLifeModel.me);
            }, function (target) {
                if (currentObject) {
                    //销毁
                    if (life.isInit) {
                        currentObject.destroy();
                    }
                    p.remove();
                    currentObject = null;
                }
                if (target) {
                    //初始化
                    currentObject = mx.buildSingle(currentLifeModel.me, target, p);
                    if (life.isInit) {
                        currentObject.init();
                    }
                }
            });
            return life;
        };
    }
    exports.ifSingle = ifSingle;
});
