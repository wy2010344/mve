define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.toTrs = exports.generate = void 0;
    /**
     *
     * @param p
     */
    function generate(p) {
        var body = [];
        var reduce = function (o, parentArray) {
            var thisArray = parentArray.concat(p.cell(o));
            if (p.isBranch(o)) {
                //父节点
                p.forEach(o, function (child, i) {
                    reduce(child, thisArray);
                });
            }
            else {
                //视作叶子节点
                /**叶子节点换行**/
                body.push(p.row(thisArray, body, o));
            }
        };
        //祖宗链，自己->父->祖
        var parentArray = [];
        mb.Array.forEach(p.data, function (o) {
            reduce(o, parentArray);
        });
        return body;
    }
    exports.generate = generate;
    ;
    var VCell = /** @class */ (function () {
        function VCell(node) {
            this.node = node;
            this.used = false;
            this.colspan = 1;
            this.rowspan = 1;
            node.attr = node.attr || {};
            node.attr.colspan = 1;
            node.attr.rowspan = 1;
        }
        VCell.prototype.addColSpan = function (v) {
            this.colspan += v;
            this.node.attr.colspan = this.colspan;
        };
        VCell.prototype.addRowSpan = function (v) {
            this.rowspan += v;
            this.node.attr.rowspan = this.rowspan;
        };
        return VCell;
    }());
    function toTrs(p) {
        //最大深度
        var max = 0;
        var trs = generate({
            data: p.data,
            isBranch: p.isBranch,
            forEach: p.forEach,
            cell: function (o) {
                var m = p.cell(o);
                return new VCell(m);
            },
            row: function (array, body, o) {
                var thisCell = [];
                mb.Array.forEach(array, function (cell) {
                    if (cell.used) {
                        //自父祖被上一行使用过。
                        cell.addRowSpan(1);
                    }
                    else {
                        //自父祖未被上一行使用，更新。
                        thisCell.push(cell);
                        cell.used = true;
                    }
                });
                if (max < array.length) {
                    var diff_1 = array.length - max;
                    max = array.length;
                    //为别的项的最后一行的列更深至最大深度
                    mb.Array.forEach(body, function (row) {
                        var len = row.left.length;
                        var last = row.left[len - 1];
                        last.addColSpan(diff_1);
                    });
                }
                else {
                    //自己的列未达到最大深度，
                    var len = array.length;
                    var last = array[len - 1];
                    last.addColSpan(max - len);
                }
                return {
                    left: thisCell,
                    children: thisCell.map(function (v) { return v.node; }).concat(p.rightCells(o))
                };
            }
        });
        return {
            /*生成的表结果，需要简单转化*/
            trs: trs,
            /**总跨列 */
            colspan: max //跨列
        };
    }
    exports.toTrs = toTrs;
    ;
});
