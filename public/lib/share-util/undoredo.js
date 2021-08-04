define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.UndoRedoStack = void 0;
    var UndoRedoStack = /** @class */ (function () {
        function UndoRedoStack(max) {
            if (max === void 0) { max = 400; }
            this.max = max;
            this.stack = [];
            /**位置*/
            this.flag = 0;
        }
        UndoRedoStack.prototype.pushAnDo = function (unredo) {
            if (this.flag < this.stack.length) {
                this.stack.length = this.flag; //去除后面的
            }
            this.stack.push(unredo);
            if (this.stack.length == this.max) {
                this.stack.shift();
                this.flag--;
            }
            unredo.redo();
            this.flag++;
        };
        UndoRedoStack.prototype.undo = function () {
            if (this.flag > 0) {
                this.flag--;
                this.stack[this.flag].undo();
            }
        };
        UndoRedoStack.prototype.redo = function () {
            if (this.flag < this.stack.length) {
                this.stack[this.flag].redo();
                this.flag++;
            }
        };
        return UndoRedoStack;
    }());
    exports.UndoRedoStack = UndoRedoStack;
});
