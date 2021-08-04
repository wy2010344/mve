var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.MNumberSet = exports.MStringSet = exports.mJoin = exports.MSubSet = exports.MAddSet = exports.MWriteSet = exports.MLimitSet = exports.MSet = exports.isSetListEqual = exports.isSetItemEqual = void 0;
    /**两个集合对象是否相同*/
    function isSetItemEqual(a, b) {
        if (a == b) {
            return true;
        }
        else {
            if (a && typeof (a) == 'object') {
                if (mb.Array.isArray(a)) {
                    return isSetListEqual(a, b);
                }
                else {
                    return a.equalsWhenNotSame(b);
                }
            }
            else if (b && typeof (b) == 'object') {
                if (mb.Array.isArray(b)) {
                    return isSetListEqual(b, a);
                }
                else {
                    return b.equalsWhenNotSame(a);
                }
            }
        }
        return false;
    }
    exports.isSetItemEqual = isSetItemEqual;
    /**两个列表是否匹配*/
    function isSetListEqual(as, bs) {
        if (mb.Array.isArray(bs)) {
            if (as.length == bs.length) {
                var r = true;
                for (var i = 0; i < as.length; i++) {
                    r = isSetItemEqual(as[i], bs[i]) && r;
                }
                return r;
            }
        }
        return false;
    }
    exports.isSetListEqual = isSetListEqual;
    /**
     * 抽象的集合类
     *
     * 类似数据库的方法
     *
     * 判断是否是真子集，取补集为空
     *
     *
     * 集合不一定能取交集
     * 但一定能判断包含
     * 部分集合能明确地取交集
     * 可以用泛型圈定集合演算的范围
     *
     *
     * 类型是集合的演算，元素之上是类型。
     * 集合也需要判断是否是子集合，便是类型的兼容性。
     *
     */
    var MSet = /** @class */ (function () {
        function MSet() {
        }
        return MSet;
    }());
    exports.MSet = MSet;
    /**有限集合只有这一个*/
    var MLimitSet = /** @class */ (function (_super) {
        __extends(MLimitSet, _super);
        function MLimitSet() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /////////////////////////////////////////
            _this.set = [];
            return _this;
        }
        ////////////////////////////////////////////////
        /**当不是同一个对象时，是否 */
        MLimitSet.prototype.equalsWhenNotSame = function (right) {
            if (right instanceof MLimitSet && right.set.length == this.set.length) {
                return this.set.every(function (v) { return right.contain(v); });
            }
            return false;
        };
        /////////////////////////////////////////////
        MLimitSet.prototype.contain = function (v) {
            return this.containAt(v) > -1;
        };
        //////////////////////////////////////////////
        MLimitSet.prototype.size = function () { return this.set.length; };
        MLimitSet.prototype.innerJoin = function (right) {
            var set = new MLimitSet();
            this.forEach(function (v) {
                if (right.contain(v)) {
                    set.set.push(v);
                }
            });
            return set;
        };
        MLimitSet.prototype.outterJoin = function (right) {
            var set = new MWriteSet();
            set.set = this.set.map(function (v) { return v; });
            for (var i = 0; i < right.size(); i++) {
                set.push(right.get(i));
            }
            return set;
        };
        /**left-right*/
        MLimitSet.leftNullJoin = function (left, right) {
            var set = new MWriteSet();
            var size = left.size();
            for (var i = 0; i < size; i++) {
                var v = left.get(i);
                if (!left.contain(v)) {
                    set.set.push(v);
                }
            }
            return set;
        };
        MLimitSet.prototype.leftNullJoin = function (right) {
            return MLimitSet.leftNullJoin(this, right);
        };
        MLimitSet.prototype.rightNullJoin = function (right) {
            return MLimitSet.leftNullJoin(right, this);
        };
        MLimitSet.prototype.nullJoin = function (right) {
            var set = new MWriteSet();
            set.set = this.set.map(function (v) { return v; });
            var size = right.size();
            for (var i = 0; i < size; i++) {
                var v = right.get(i);
                if (set.remove(v) < 0) {
                    set.set.push(v);
                }
            }
            return set;
        };
        MLimitSet.prototype.get = function (index) {
            return this.set[index];
        };
        MLimitSet.prototype.forEach = function (fun) {
            for (var i = 0; i < this.set.length; i++) {
                fun(this.set[i], i);
            }
        };
        /**
         * 是否包含该元素，未找到，返回-1
         * @param v
         */
        MLimitSet.prototype.containAt = function (v) {
            for (var i = 0; i < this.set.length; i++) {
                var item = this.set[i];
                if (isSetItemEqual(item, v)) {
                    return i;
                }
            }
            return -1;
        };
        return MLimitSet;
    }(MSet));
    exports.MLimitSet = MLimitSet;
    /**
     * 可读写集合，只能作计算，不能作值
     */
    var MWriteSet = /** @class */ (function (_super) {
        __extends(MWriteSet, _super);
        function MWriteSet() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MWriteSet.from = function (v) {
            var set = new MWriteSet();
            v.forEach(function (v) {
                set.set.push(v);
            });
            return set;
        };
        /**
         * 插入，如果越界返回-2，如果成功返回-1，如果失败返回存在的位置
         * @param index
         * @param v
         */
        MWriteSet.prototype.insert = function (index, v) {
            if (index < 0 || index > this.size()) {
                return -2;
            }
            var existIdx = this.containAt(v);
            if (existIdx < 0) {
                this.set.splice(index, 0, v);
            }
            return existIdx;
        };
        /**
         * 增加集合元素到最前面，如果已经存在，则返回存在元素位置
         * @param v
         */
        MWriteSet.prototype.unshift = function (v) {
            var existIdx = this.containAt(v);
            if (existIdx < 0) {
                this.set.unshift(v);
            }
            return existIdx;
        };
        /**
           * 增加集合元素在最后，如果已经存在，则返回存在元素的位置
           * @param v 被增加的元素
           */
        MWriteSet.prototype.push = function (v) {
            var existIdx = this.containAt(v);
            if (existIdx < 0) {
                this.set.push(v);
            }
            return existIdx;
        };
        /**
           *
         * 移除集合元素，如果未找到，返回-1
         * @param v 被移除集合元素
           */
        MWriteSet.prototype.remove = function (v) {
            var index = this.containAt(v);
            if (index > -1) {
                this.set.splice(index, 1);
                return index;
            }
            else {
                return -1;
            }
        };
        /**增加成功的标识 */
        MWriteSet.ADD_SUCCESS = -1;
        /**插入越界 */
        MWriteSet.INSERT_FAILED = -2;
        return MWriteSet;
    }(MLimitSet));
    exports.MWriteSet = MWriteSet;
    /**
     * 利用集合的交换律+结合律来归一化。
     * 变成一个大项的集合
     * 枚举项集合元素的化简。
     *
     * 匹配规则的集合能演算（比如有限集合），不能匹配的不能演算。
     * 甚至交叉型类型(乘集合)
     * 只有contain的集合，只能累加出一份逻辑性的校验公式，对值进行判断。
     *
     * 类型校验时，只是校验下一层的集合是否包含上一层呢（真子集）
     *
     * 事实上在drawProgram里面，自定义类型，类型自己去判断是否是上一层的类型，
     * 所以类型之间有内部演算。每个节点都有类型名字。
     */
    /**和型集合 */
    var MAddSet = /** @class */ (function (_super) {
        __extends(MAddSet, _super);
        function MAddSet(left, right) {
            var _this = _super.call(this) || this;
            _this.left = left;
            _this.right = right;
            return _this;
        }
        MAddSet.prototype.contain = function (right) {
            return this.left.contain(right) || this.right.contain(right);
        };
        return MAddSet;
    }(MSet));
    exports.MAddSet = MAddSet;
    /**差型集合 */
    var MSubSet = /** @class */ (function (_super) {
        __extends(MSubSet, _super);
        function MSubSet(left, right) {
            var _this = _super.call(this) || this;
            _this.left = left;
            _this.right = right;
            return _this;
        }
        MSubSet.prototype.contain = function (right) {
            return this.left.contain(right) && !this.right.contain(right);
        };
        return MSubSet;
    }(MSet));
    exports.MSubSet = MSubSet;
    exports.mJoin = {
        /**left-right */
        leftNullJoin: function (left, right) {
            return new MSubSet(left, right);
        },
        /**right-left */
        rightNullJoin: function (left, right) {
            return new MSubSet(right, left);
        },
        /**left+right */
        outterJoin: function (left, right) {
            return new MAddSet(left, right);
        },
        /**(left-right)+(right-left)*/
        nullJoin: function (left, right) {
            return new MAddSet(exports.mJoin.leftNullJoin(left, right), exports.mJoin.rightNullJoin(left, right));
        },
        /**(left+right)-[(left-right)+(right-left)]*/
        innerJoin: function (left, right) {
            return new MSubSet(exports.mJoin.outterJoin(left, right), exports.mJoin.innerJoin(left, right));
        }
    };
    /**无限字符串集合*/
    var MStringSet = /** @class */ (function (_super) {
        __extends(MStringSet, _super);
        function MStringSet() {
            return _super.call(this) || this;
        }
        MStringSet.prototype.contain = function (right) {
            return typeof (right) == 'string';
        };
        MStringSet.prototype.equalsWhenNotSame = function (right) {
            return right instanceof MStringSet;
        };
        MStringSet.instance = new MStringSet();
        return MStringSet;
    }(MSet));
    exports.MStringSet = MStringSet;
    /**无限数字集合*/
    var MNumberSet = /** @class */ (function (_super) {
        __extends(MNumberSet, _super);
        function MNumberSet() {
            return _super.call(this) || this;
        }
        MNumberSet.prototype.contain = function (right) {
            return typeof (right) == 'number';
        };
        MNumberSet.prototype.equalsWhenNotSame = function (right) {
            return right instanceof MNumberSet;
        };
        MNumberSet.instance = new MNumberSet();
        return MNumberSet;
    }(MSet));
    exports.MNumberSet = MNumberSet;
});
