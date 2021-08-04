define(["require", "exports", "./virtualTreeChildren", "./util"], function (require, exports, virtualTreeChildren_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.childrenBuilder = exports.baseChildrenBuilder = exports.isEOChildFunType = exports.ChildLife = void 0;
    /**存放空的生命周期 */
    var ChildLife = /** @class */ (function () {
        function ChildLife(result) {
            this.result = result;
        }
        ChildLife.of = function (result) {
            return new ChildLife(result);
        };
        return ChildLife;
    }());
    exports.ChildLife = ChildLife;
    function isEOChildFunType(child) {
        return typeof (child) == 'function';
    }
    exports.isEOChildFunType = isEOChildFunType;
    function childBuilder(out, child, parent, me) {
        if (mb.Array.isArray(child)) {
            var i = 0;
            while (i < child.length) {
                childBuilder(out, child[i], parent, me);
                i++;
            }
        }
        else if (isEOChildFunType(child)) {
            out.push(child(parent.newChildAtLast(), me));
        }
        else if (child instanceof ChildLife) {
            out.push(child.result);
        }
        else {
            parent.push(child);
        }
    }
    function baseChildrenBuilder(me, children, parent) {
        var out = util_1.BuildResultList.init();
        childBuilder(out, children, parent, me);
        return util_1.onceLife(out.getAsOne()).out;
    }
    exports.baseChildrenBuilder = baseChildrenBuilder;
    function childrenBuilder(me, x, children) {
        return baseChildrenBuilder(me, children, virtualTreeChildren_1.VirtualChild.newRootChild(x));
    }
    exports.childrenBuilder = childrenBuilder;
});
