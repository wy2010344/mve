define(["require", "exports", "../DOM"], function (require, exports, DOM) {
    "use strict";
    exports.__esModule = true;
    exports.DOMVirtualParam = void 0;
    var DOMVirtualParam = /** @class */ (function () {
        function DOMVirtualParam(pel) {
            this.pel = pel;
        }
        DOMVirtualParam.prototype.append = function (el) {
            DOM.appendChild(this.pel, el);
        };
        DOMVirtualParam.prototype.remove = function (el) {
            DOM.removeChild(this.pel, el);
        };
        DOMVirtualParam.prototype.insertBefore = function (el, oldEl) {
            DOM.insertChildBefore(this.pel, el, oldEl);
        };
        return DOMVirtualParam;
    }());
    exports.DOMVirtualParam = DOMVirtualParam;
});
