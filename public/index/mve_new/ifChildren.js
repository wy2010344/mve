define(["require", "exports", "./onceLife"], function (require, exports, onceLife_1) {
    "use strict";
    exports.__esModule = true;
    function ifChildren(fun) {
        return function (mx, parent) {
            var currentObject;
            var currentLifeModel;
            var virtualChild;
            var life = onceLife_1.onceLife({
                init: function () {
                    currentObject.init();
                },
                destroy: function () {
                    w.disable();
                    currentObject.destroy();
                    currentLifeModel.destroy();
                }
            });
            var w = mve.Watch({
                before: function () {
                    if (currentLifeModel) {
                        currentLifeModel.destroy();
                    }
                    currentLifeModel = mve.lifeModel();
                },
                exp: function () {
                    return fun(currentLifeModel.me);
                },
                after: function (children) {
                    if (virtualChild) {
                        parent.remove(0);
                    }
                    if (currentObject) {
                        if (life.isInit) {
                            currentObject.destroy();
                        }
                    }
                    currentLifeModel = mve.lifeModel();
                    virtualChild = parent.newChildAtLast();
                    currentObject = mx.buildChildren(currentLifeModel.me, children, virtualChild);
                    if (life.isInit) {
                        currentObject.init();
                    }
                }
            });
            return life;
        };
    }
    exports.ifChildren = ifChildren;
});
