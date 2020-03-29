define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    /**
     * 递归查找下一个节点
     * @param obj
     */
    function findFirstElement(obj) {
        if ('element' in obj) {
            //普通节点
            return obj.element;
        }
        else {
            //复合节点
            var element = obj.firstElement();
            if (element) {
                return element;
            }
            else {
                return findFirstElement(obj.getNextObject());
            }
        }
    }
    exports.findFirstElement = findFirstElement;
    /**从列表中选择 */
    function findFirstElementArray(vs) {
        var i = 0;
        var el = null;
        while (i < vs.length && el == null) {
            el = findFirstElement(vs[i]);
            i++;
        }
        return el;
    }
    exports.findFirstElementArray = findFirstElementArray;
    /**深度遍历虚拟操作元素树*/
    function deepRun(vs, fun) {
        for (var i = 0; i < vs.length; i++) {
            var v = vs[i];
            if ('element' in v) {
                fun(v);
            }
            else {
                v.deepRun(fun);
            }
        }
    }
    exports.deepRun = deepRun;
});
