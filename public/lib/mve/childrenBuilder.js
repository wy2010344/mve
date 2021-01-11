define(["require", "exports", "./virtualTreeChildren", "./util"], function (require, exports, virtualTreeChildren_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.childrenBuilder = exports.isJOChildrenLifeType = exports.isJOChildFunType = exports.Article = exports.newArticle = void 0;
    function newArticle() {
        var lines = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            lines[_i] = arguments[_i];
        }
        return new Article(lines);
    }
    exports.newArticle = newArticle;
    var Article = /** @class */ (function () {
        function Article(out) {
            if (out === void 0) { out = []; }
            this.out = out;
        }
        Article.prototype.append = function (v) {
            this.out.push(v);
            return this;
        };
        return Article;
    }());
    exports.Article = Article;
    function isJOChildFunType(child) {
        return typeof (child) == 'function';
    }
    exports.isJOChildFunType = isJOChildFunType;
    function isJOChildrenLifeType(child) {
        return typeof (child) == 'object' && 'elements' in child && mb.Array.isArray(child.elements);
    }
    exports.isJOChildrenLifeType = isJOChildrenLifeType;
    function childBuilder(out, child, parent, me, parse, buildChildren) {
        if (isJOChildFunType(child)) {
            out.push(child(buildChildren, parent.newChildAtLast()));
        }
        else if (isJOChildrenLifeType(child)) {
            out.push(child);
            childrenVSBuilder(out, child.elements, parent, me, parse, buildChildren);
        }
        else {
            var vs = parse(me, child);
            out.orPush(vs);
            parent.push(vs.element);
        }
    }
    function childrenVBuilder(out, child, parent, me, parse, buildChildren) {
        if (mb.Array.isArray(child)) {
            var i = 0;
            while (i < child.length) {
                childBuilder(out, child[i], parent, me, parse, buildChildren);
                i++;
            }
        }
        else {
            childBuilder(out, child, parent, me, parse, buildChildren);
        }
    }
    function childrenVSBuilder(out, children, parent, me, parse, buildChildren) {
        //数组元素
        var i = 0;
        while (i < children.length) {
            var child = children[i];
            i++;
            childrenVBuilder(out, child, parent, me, parse, buildChildren);
        }
    }
    function childrenBuilder(parse) {
        var baseBuilder = function (me, children, parent) {
            var out = util_1.BuildResultList.init();
            childrenVBuilder(out, children, parent, me, parse, baseBuilder);
            return util_1.onceLife(out.getAsOne()).out;
        };
        return function (me, x, children) {
            return baseBuilder(me, children, virtualTreeChildren_1.VirtualChild.newRootChild(x));
        };
    }
    exports.childrenBuilder = childrenBuilder;
});
