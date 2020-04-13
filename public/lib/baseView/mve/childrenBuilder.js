define(["require", "exports", "../../mve/virtualTreeChildren"], function (require, exports, virtualTreeChildren_1) {
    "use strict";
    exports.__esModule = true;
    function isJOChildFunType(child) {
        return typeof (child) == 'function';
    }
    exports.isJOChildFunType = isJOChildFunType;
    function childrenBuilder(parseView) {
        var mx = {
            buildChildren: function (me, children, parent) {
                var array = [];
                var i = 0;
                while (i < children.length) {
                    var child = children[i];
                    if (isJOChildFunType(child)) {
                        var cv = parent.newChildAtLast();
                        array.push(child(mx, cv));
                    }
                    else {
                        var o = parseView(me, child);
                        parent.push(o.element);
                        array.push(o);
                    }
                    i = i + 1;
                }
                return {
                    destroy: function () {
                        array.forEach(function (row) {
                            row.destroy();
                        });
                    }
                };
            }
        };
        return function (me, p, children) {
            var vm = virtualTreeChildren_1.VirtualChild.newRootChild(p);
            return mx.buildChildren(me, children, vm);
        };
    }
    exports.childrenBuilder = childrenBuilder;
});
