define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.appendStr = exports.eqStr = exports.ShareString = exports.test = exports.match = void 0;
    var Char = /** @class */ (function () {
        function Char(c) {
            this.code = c.charCodeAt(0);
            this.char = c.charAt(0);
        }
        Char.prototype.toString = function () {
            return this.char;
        };
        return Char;
    }());
    exports.match = {
        andRule: function () {
            var rules = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                rules[_i] = arguments[_i];
            }
            return {
                type: "and",
                rules: rules
            };
        },
        orRule: function () {
            var rules = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                rules[_i] = arguments[_i];
            }
            return {
                type: "or",
                rules: rules
            };
        },
        repeatRule: function (rule, min, max) {
            if (min === void 0) { min = 0; }
            if (max === void 0) { max = Infinity; }
            return {
                type: "repeat",
                rule: rule,
                min: min,
                max: max
            };
        },
        eq: function (v) {
            v = v.charAt(0);
            return function (str, i) {
                return str[i] == v;
            };
        },
        between: function (a, b) {
            var an = a.charCodeAt(0);
            var bn = b.charCodeAt(0);
            return function (str, i) {
                var v = str.charCodeAt(i);
                return an <= v && v <= bn;
            };
        },
        "in": function () {
            var vs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                vs[_i] = arguments[_i];
            }
            vs = vs.map(function (v) { return v.charAt(0); });
            return function (str, i) {
                return vs.indexOf(str[i]) > -1;
            };
        }
    };
    function test(str, i, rule) {
        if (typeof (rule) == 'function') {
            return rule(str, i);
        }
        else {
            if (rule.type == "and") {
                for (var x = 0; x < rule.rules.length; i++) {
                    if (test(str, i, rule.rules[i])) {
                        i++;
                    }
                    else {
                        return false;
                    }
                }
                return true;
            }
            else if (rule.type == "or") {
                for (var x = 0; x < rule.rules.length; i++) {
                    if (test(str, i, rule.rules[i])) {
                        return true;
                    }
                }
                return false;
            }
            else {
                var count = 0;
                while (true) {
                    if (test(str, i, rule.rule)) {
                        count++;
                        i++;
                    }
                    else {
                        break;
                    }
                }
                return rule.min <= count && count <= rule.max;
            }
        }
    }
    exports.test = test;
    /////////////////////////////////////////////////////////////////
    var ShareString = /** @class */ (function () {
        function ShareString(str, begin, end) {
            this.str = str;
            this.begin = begin;
            this.end = end;
            this.length = end - begin;
        }
        ShareString.of = function (str, begin, end) {
            if (begin === void 0) { begin = 0; }
            if (end === void 0) { end = str.length; }
            return new ShareString(str, begin, end);
        };
        ShareString.prototype.toString = function () {
            return this.str.slice(this.begin, this.end);
        };
        ShareString.prototype.charAt = function (i) {
            return this.str.charAt(i + this.begin);
        };
        ShareString.prototype.charCodeAt = function (i) {
            return this.str.charCodeAt(i + this.begin);
        };
        ShareString.prototype.slice = function (begin, end) {
            if (begin === void 0) { begin = 0; }
            if (end === void 0) { end = this.length; }
            return ShareString.of(this.str, this.begin + begin, this.end + end);
        };
        ShareString.prototype.indexOfStr = function (str, i) {
            if (i === void 0) { i = 0; }
            var index = this.str.indexOf(str, this.begin + i);
            if (index < 0 || index > (this.end - str.length)) {
                return -1;
            }
            else {
                return index - this.begin;
            }
        };
        ShareString.prototype.indexOf = function (str, i) {
            if (i === void 0) { i = 0; }
            return this.indexOfStr(str.toString(), i);
        };
        ShareString.prototype.startsWithStr = function (str) {
            return this.indexOfStr(str) == 0;
        };
        ShareString.prototype.startsWith = function (str) {
            return this.startsWithStr(str.toString());
        };
        ShareString.prototype.endsWith = function (str) {
            return this.endsWithStr(str.toString());
        };
        ShareString.prototype.endsWithStr = function (str) {
            var idx = this.length - str.length;
            return this.indexOfStr(str, idx) == idx;
        };
        ShareString.prototype.unshiftStr = function (str) {
            var idx = this.begin - str.length;
            if (this.str.indexOf(str, idx) == idx) {
                return ShareString.of(this.str, idx, this.end);
            }
        };
        ShareString.prototype.pushStr = function (str) {
            if (this.str.indexOf(str, this.end) == this.end) {
                return ShareString.of(this.str, this.begin, this.end + str.length);
            }
        };
        ShareString.prototype.shiftStr = function (str) {
            if (str.length < this.length && this.str.indexOf(str, this.begin) == this.begin) {
                return ShareString.of(this.str, this.begin + str.length, this.end);
            }
        };
        ShareString.prototype.popStr = function (str) {
            var idx = this.end - str.length;
            if (str.length < this.length && this.str.indexOf(str, idx) == idx) {
                return ShareString.of(this.str, this.begin, idx);
            }
        };
        return ShareString;
    }());
    exports.ShareString = ShareString;
    function eqStr() {
    }
    exports.eqStr = eqStr;
    function appendStr() {
    }
    exports.appendStr = appendStr;
});
