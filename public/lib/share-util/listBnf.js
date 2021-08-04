define(["require", "exports", "./map"], function (require, exports, map_1) {
    "use strict";
    exports.__esModule = true;
    exports.buildParseString = exports.buildSliceString = exports.parseJSFloat = exports.rangeWSChars = exports.wsChars = exports.transparent = exports.getValueThen = exports.getValueLocation = exports.getValue = exports.stringMatch = exports.rangeNotOf = exports.rangeOf = exports.between = exports.parseGet = exports.LocError = exports.ParseSuccess = exports.getOr = exports.getMany = exports.getAnd = exports.get = exports.eof = exports.empty = exports.zeroOrOne = exports.many = exports.or = exports.and = exports.Match = void 0;
    var ParserFail = /** @class */ (function () {
        function ParserFail(value, index, rule, message) {
            this.value = value;
            this.index = index;
            this.rule = rule;
            this.message = message;
        }
        return ParserFail;
    }());
    /**匹配成功与失败*/
    var Match = /** @class */ (function () {
        function Match(run) {
            this.run = run;
        }
        Match.of = function (run) {
            return new Match(run);
        };
        return Match;
    }());
    exports.Match = Match;
    function isDelayBaseRule(v) {
        return typeof (v) == 'function';
    }
    var AndRule = /** @class */ (function () {
        function AndRule(rules) {
            this.rules = rules;
        }
        return AndRule;
    }());
    function and() {
        var rules = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rules[_i] = arguments[_i];
        }
        return new AndRule(rules);
    }
    exports.and = and;
    var OrRule = /** @class */ (function () {
        function OrRule(rules) {
            this.rules = rules;
        }
        return OrRule;
    }());
    function or() {
        var rules = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rules[_i] = arguments[_i];
        }
        return new OrRule(rules);
    }
    exports.or = or;
    var ManyRule = /** @class */ (function () {
        function ManyRule(rule, min, max) {
            if (min === void 0) { min = 0; }
            if (max === void 0) { max = Infinity; }
            this.rule = rule;
            this.min = min;
            this.max = max;
        }
        return ManyRule;
    }());
    function many(rule, min, max) {
        if (min === void 0) { min = 0; }
        if (max === void 0) { max = Infinity; }
        return new ManyRule(rule, min, max);
    }
    exports.many = many;
    function zeroOrOne(rule) {
        return new ManyRule(rule, 0, 1);
    }
    exports.zeroOrOne = zeroOrOne;
    exports.empty = Match.of(function (vs, i) {
        return i;
    });
    exports.eof = Match.of(function (vs, i) {
        return i == vs.size() ? i : "\u5E76\u975E\u8FBE\u5230\u7ED3\u675F";
    });
    function pureParse(rule, pool) {
        if (rule instanceof Match) {
            return function (value, i) {
                var r = rule.run(value, i);
                if (typeof (r) == 'string') {
                    return new ParserFail(value, i, rule, r);
                }
                return r;
            };
        }
        else if (rule instanceof AndRule) {
            var rules_1 = rule.rules;
            return function (value, i) {
                for (var x = 0; x < rules_1.length; x++) {
                    var rule_1 = rules_1[x];
                    var result = parse(rule_1, pool)(value, i);
                    if (parseFail(result)) {
                        return result;
                    }
                    i = result;
                }
                return i;
            };
        }
        if (rule instanceof OrRule) {
            var rules_2 = rule.rules;
            return function (value, i) {
                for (var x = 0; x < rules_2.length; x++) {
                    var rule_2 = rules_2[x];
                    var result = parse(rule_2, pool)(value, i);
                    if (parseSuccess(result)) {
                        return result;
                    }
                }
                return new ParserFail(value, i, rule, "\u672A\u5339\u914D\u4EFB\u4F55\u4E00\u4E2A\u89C4\u5219");
            };
        }
        else if (rule instanceof ManyRule) {
            var min_1 = rule.min;
            var max_1 = rule.max;
            return function (value, i) {
                var innerRule = parse(rule.rule, pool);
                var count = 0;
                while (true) {
                    var r = innerRule(value, i);
                    if (parseFail(r)) {
                        if (count < min_1) {
                            return new ParserFail(value, i, rule, "\u5339\u914D\u5C0F\u4E8E\u6700\u5C0F\u503C" + min_1);
                        }
                        return i;
                    }
                    count++;
                    if (count > max_1) {
                        return i;
                    }
                    i = r;
                }
            };
        }
    }
    function parse(_rule, pool) {
        var rule = isDelayBaseRule(_rule) ? _rule() : _rule;
        var existFun = pool.get(rule);
        if (existFun) {
            return existFun;
        }
        else {
            var newFun = pureParse(rule, pool);
            pool.set(rule, newFun);
            return newFun;
        }
    }
    function parseSuccess(v) {
        return typeof (v) == 'number';
    }
    function parseFail(v) {
        return typeof (v) != 'number';
    }
    /////////////////////////////取值部分///////////////////////////////////////////
    var Get = /** @class */ (function () {
        function Get(rule, get) {
            this.rule = rule;
            this.get = get;
        }
        return Get;
    }());
    function get(rule, get) {
        return new Get(rule, get);
    }
    exports.get = get;
    var GetAnd = /** @class */ (function () {
        function GetAnd(vs) {
            this.vs = vs;
        }
        return GetAnd;
    }());
    function getAnd() {
        var vs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            vs[_i] = arguments[_i];
        }
        return new GetAnd(vs);
    }
    exports.getAnd = getAnd;
    /**可以用0-1的匹配*/
    var GetMany = /** @class */ (function () {
        function GetMany(repeat, get) {
            this.repeat = repeat;
            this.get = get;
        }
        return GetMany;
    }());
    function getMany(repeat, get) {
        return new GetMany(repeat, get);
    }
    exports.getMany = getMany;
    var GetOr = /** @class */ (function () {
        function GetOr(rules) {
            this.rules = rules;
        }
        return GetOr;
    }());
    function getOr() {
        var vs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            vs[_i] = arguments[_i];
        }
        return new GetOr(vs);
    }
    exports.getOr = getOr;
    function isDelayPGet(v) {
        return typeof (v) == 'function';
    }
    var ParseSuccess = /** @class */ (function () {
        function ParseSuccess(index, value, end) {
            this.index = index;
            this.value = value;
            this.end = end;
        }
        return ParseSuccess;
    }());
    exports.ParseSuccess = ParseSuccess;
    var LocError = /** @class */ (function () {
        function LocError(index, rule, message) {
            this.index = index;
            this.rule = rule;
            this.message = message;
        }
        LocError.prototype.toString = function () {
            if (this.message instanceof LocError) {
                return this.message.toString();
            }
            else if (this.message instanceof ParserFail) {
                return this.message.message;
            }
            else {
                return this.message;
            }
        };
        return LocError;
    }());
    exports.LocError = LocError;
    function pureParseGet(rule, pool, funPool) {
        if (rule instanceof Get) {
            return function (value, i) {
                var contentRule = parse(rule.rule, funPool);
                var r = contentRule(value, i);
                if (parseFail(r)) {
                    return new LocError(i, rule, r);
                }
                else {
                    return new ParseSuccess(i, rule.get(value, i, r), r);
                }
            };
        }
        else if (rule instanceof GetMany) {
            return function (value, i) {
                var contentRule = parseGet(rule.repeat, pool, funPool);
                var ts = [];
                var fg = i;
                while (true) {
                    var vr = contentRule(value, fg);
                    if (vr instanceof LocError) {
                        break;
                    }
                    ts.push(vr.value);
                    fg = vr.end;
                }
                return new ParseSuccess(i, rule.get(ts), fg);
            };
        }
        else if (rule instanceof GetAnd) {
            var vs_1 = rule.vs;
            var max_2 = vs_1.length - 1;
            var get_1 = vs_1.getLast();
            return function (value, i) {
                var begin = i;
                var all = [];
                for (var x = 0; x < max_2; x++) {
                    if (x % 2 == 0) {
                        //偶数
                        var tmpV = parse(vs_1[x], funPool);
                        var tp = tmpV(value, i);
                        if (parseFail(tp)) {
                            return new LocError(i, rule, tp);
                        }
                        i = tp;
                    }
                    else {
                        //奇数
                        var tmpV = parseGet(vs_1[x], pool, funPool);
                        var tp = tmpV(value, i);
                        if (tp instanceof LocError) {
                            return new LocError(i, rule, tp);
                        }
                        i = tp.end;
                        all.push(tp.value);
                    }
                }
                return new ParseSuccess(begin, get_1.apply(null, all), i);
            };
        }
        else if (rule instanceof GetOr) {
            return function (value, i) {
                for (var _i = 0, _a = rule.rules; _i < _a.length; _i++) {
                    var g = _a[_i];
                    var o = parseGet(g, pool, funPool)(value, i);
                    if (o instanceof ParseSuccess) {
                        return o;
                    }
                }
                return new LocError(i, rule, "未匹配任一表达式");
            };
        }
    }
    function parseGet(_rule, pool, funPool) {
        if (pool === void 0) { pool = new map_1.Map(); }
        if (funPool === void 0) { funPool = new map_1.Map(); }
        var rule = isDelayPGet(_rule) ? _rule() : _rule;
        var existRule = pool.get(rule);
        if (existRule) {
            return existRule;
        }
        else {
            var newRule = pureParseGet(rule, pool, funPool);
            pool.set(rule, newRule);
            return newRule;
        }
    }
    exports.parseGet = parseGet;
    /////////////////////////////字符串进行封装//////////////////////////////////////////////
    var BetweenRule = /** @class */ (function () {
        function BetweenRule(begin, end) {
            this.begin = begin;
            this.end = end;
        }
        BetweenRule.prototype.toString = function () {
            return "(between '" + String.fromCharCode(this.begin) + "' '" + String.fromCharCode(this.end) + "')";
        };
        return BetweenRule;
    }());
    function between(begin, end) {
        if (begin && begin.length == 1 && end && end.length == 1) {
            var bc = begin.charCodeAt(0);
            var ec = end.charCodeAt(0);
            if (bc < ec) {
                return new BetweenRule(bc, ec);
            }
            throw "\u533A\u95F4\u5927\u5C0F\u76F8\u53CD" + begin + " - " + end;
        }
        throw "\u4E0D\u5408\u6CD5\u7684" + begin + " - " + end;
    }
    exports.between = between;
    function stringToChar(v) {
        if (v instanceof BetweenRule) {
            return v;
        }
        if (v && v.length == 1) {
            return v.charCodeAt(0);
        }
        throw "\u4E0D\u662F\u5408\u6CD5\u7684\u5B57\u7B26\u683C\u5F0F" + v;
    }
    function rangeOf() {
        var _rules = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _rules[_i] = arguments[_i];
        }
        var rules = _rules.map(stringToChar);
        return Match.of(function (vs, i) {
            if (i < vs.size()) {
                var v = vs.get(i);
                var c = v.charCodeAt(0);
                for (var _i = 0, rules_3 = rules; _i < rules_3.length; _i++) {
                    var r = rules_3[_i];
                    if (r instanceof BetweenRule) {
                        if (r.begin <= c && c <= r.end) {
                            return i + 1;
                        }
                    }
                    else if (r == c) {
                        return i + 1;
                    }
                }
                return "\u672A\u5339\u914D\u4EFB\u4E00\u89C4\u5219" + _rules;
            }
            return "\u5230\u8FBE\u6587\u4EF6\u7ED3\u5C3E";
        });
    }
    exports.rangeOf = rangeOf;
    function rangeNotOf() {
        var _rules = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _rules[_i] = arguments[_i];
        }
        var rules = _rules.map(stringToChar);
        return Match.of(function (vs, i) {
            if (i < vs.size()) {
                var v = vs.get(i);
                var c = v.charCodeAt(0);
                for (var _i = 0, rules_4 = rules; _i < rules_4.length; _i++) {
                    var r = rules_4[_i];
                    if (r instanceof BetweenRule) {
                        if (r.begin <= c && c <= r.end) {
                            return "\u5728\u533A\u95F4[" + String.fromCharCode(r.begin) + "-" + String.fromCharCode(r.end) + "]";
                        }
                    }
                    else if (r == c) {
                        return "\u5339\u914D\u4E86\u89C4\u5219" + String.fromCharCode(r);
                    }
                }
                return i + 1;
            }
            return "\u5230\u8FBE\u6587\u4EF6\u7ED3\u5C3E";
        });
    }
    exports.rangeNotOf = rangeNotOf;
    function stringMatch(xs) {
        return Match.of(function (vs, i) {
            if (i + xs.length < vs.size() + 1) {
                for (var k = 0; k < xs.length; k++) {
                    if (xs[k] == vs.get(i)) {
                        i++;
                    }
                    else {
                        return "\u672A\u5339\u914D\u89C4\u5219" + xs;
                    }
                }
                return i;
            }
            return "\u8D85\u51FA\u6587\u4EF6\u7ED3\u5C3E";
        });
    }
    exports.stringMatch = stringMatch;
    ///////////////////////////////////////////////////////////////////////
    function getValue(v, begin, end) {
        return v.slice(begin, end);
    }
    exports.getValue = getValue;
    function getValueLocation(v, begin, end) {
        return {
            begin: begin,
            value: v.slice(begin, end),
            end: end
        };
    }
    exports.getValueLocation = getValueLocation;
    function getValueThen(fun) {
        return function (v, begin, end) {
            return fun(getValue(v, begin, end));
        };
    }
    exports.getValueThen = getValueThen;
    function transparent(x) { return x; }
    exports.transparent = transparent;
    /////////////////////////////////////////////////////////////
    /**空白字符 */
    exports.wsChars = " \t\n\r".split("");
    /**空白字符串的匹配枚举 */
    exports.rangeWSChars = rangeOf.apply(void 0, exports.wsChars);
    var digitMore = many(rangeOf(between('0', '9')));
    /**
     * 解析js的number类型
     */
    exports.parseJSFloat = and(zeroOrOne(stringMatch("-")), 
    //整数部分
    or(stringMatch('0'), and(rangeOf(between('1', '9')), digitMore)), 
    //小数部分
    zeroOrOne(and(stringMatch('.'), digitMore)), 
    //科学计数部分
    zeroOrOne(and(rangeOf('e', 'E'), zeroOrOne(or(stringMatch('-'), stringMatch('+'))), digitMore)));
    /**
     * 简单的字符串匹配获取（所有原始内容），
     * 可用于字符串、注释
     * @param split
     */
    var buildSliceString = function (split, hasEof) {
        if (split.length != 2) {
            throw "\u9700\u8981\u7684\u5206\u5272\u7B26\u4E3A2";
        }
        var left = split[0];
        var right = split[1];
        var pCommentChar = or(stringMatch('\\\\'), stringMatch("\\" + right), rangeNotOf("" + right));
        if (hasEof) {
            return and(stringMatch(left), many(pCommentChar), stringMatch(right));
        }
        else {
            return and(stringMatch(left), many(pCommentChar), or(stringMatch(right), exports.eof));
        }
    };
    exports.buildSliceString = buildSliceString;
    /**
     * 生成字符串的组合子，获取字符串内容
     * @param split 只能为两位，左边右边
     */
    var buildParseString = function (split) {
        if (split.length != 2) {
            throw "\u9700\u8981\u7684\u5206\u5272\u7B26\u4E3A2";
        }
        var left = split[0];
        var right = split[1];
        return getAnd(stringMatch(left), getMany(getOr(get(stringMatch('\\\\'), function () { return "\\"; }), get(stringMatch("\\" + right), function () { return right; }), get(rangeNotOf("" + right), getValue)), transparent), stringMatch(right), function (vs) {
            return vs.join("");
        });
    };
    exports.buildParseString = buildParseString;
});
