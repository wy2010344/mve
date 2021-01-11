define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.Map = void 0;
    var Map = /** @class */ (function () {
        function Map() {
            this.kvs = [];
        }
        Map.prototype.getKVIndex = function (k) {
            return this.kvs.findIndex(function (kv) { return kv[0] == k; });
        };
        Map.prototype.getKV = function (k) {
            return this.kvs.find(function (kv) { return kv[0] == k; });
        };
        Map.prototype.set = function (k, v) {
            var kv = this.getKV(k);
            if (kv) {
                kv[1] = v;
            }
            else {
                this.kvs.push([k, v]);
            }
        };
        Map.prototype.get = function (k, def) {
            var kv = this.getKV(k);
            if (kv) {
                return kv[1];
            }
            else {
                return def;
            }
        };
        Map.prototype.clear = function () {
            this.kvs.length = 0;
        };
        Map.prototype.size = function () {
            return this.kvs.length;
        };
        Map.prototype["delete"] = function (k) {
            var idx = this.getKVIndex(k);
            if (idx > -1) {
                this.kvs.splice(idx, 1);
            }
        };
        Map.prototype.has = function (k) {
            return this.getKVIndex(k) > -1;
        };
        Map.prototype.keys = function () {
            return this.kvs.map(function (kv) { return kv[0]; });
        };
        Map.prototype.values = function () {
            return this.kvs.map(function (kv) { return kv[1]; });
        };
        Map.prototype.forEach = function (fun) {
            this.kvs.forEach(function (kv) { return fun(kv[1], kv[0]); });
        };
        return Map;
    }());
    exports.Map = Map;
});
