define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.createPointBezier = exports.createBezierPoints = void 0;
    /**
     * 参考
     * https://www.cnblogs.com/lxiang/p/4995255.html
     * @param anchorPoints
     * @param amount 点数量
     */
    function createBezierPoints(anchorPoints, amount) {
        var points = [];
        for (var i = 0; i < amount; i++) {
            points.push(createPointBezier(anchorPoints, i / (amount - 1)));
        }
        return points;
    }
    exports.createBezierPoints = createBezierPoints;
    /**
     * 项数https://zhuanlan.zhihu.com/p/143141894
     * @param start
     * @param end
     */
    function erxiangshi(start, end) {
        var cs = 1, bcs = 1;
        while (end > 0) {
            cs *= start;
            bcs *= end;
            start--;
            end--;
        }
        return cs / bcs;
    }
    /**
     * 计算贝塞尔点
     * @param anchorPoints 锚点
     * @param t 0~1
     */
    function createPointBezier(anchorPoints, t) {
        var length = anchorPoints.size();
        var x = 0, y = 0;
        anchorPoints.forEach(function (point, i) {
            var cn = erxiangshi(length - 1, i);
            var val = Math.pow(1 - t, length - 1 - i) * Math.pow(t, i) * cn;
            x += (point.x * val);
            y += (point.y * val);
        });
        return {
            x: x,
            y: y
        };
    }
    exports.createPointBezier = createPointBezier;
});
