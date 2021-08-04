define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.randomColor = exports.random255 = exports.rgbFromBgColor = exports.hexFromBgColor = exports.bgColorfromHex = exports.GB_MAX_VALUE = void 0;
    exports.GB_MAX_VALUE = 255;
    /**
     * 从#36297b6b 转成 "{"red":54,"green":41,"blue":123,"alpha":255}"
     * @param v
     */
    function bgColorfromHex(v) {
        var color = {
            red: parseInt(v.substr(1, 2), 16),
            green: parseInt(v.substr(3, 2), 16),
            blue: parseInt(v.substr(5, 2), 16),
            alpha: 255
        };
        if (v.length == 9) {
            //带alpha分量
            color.alpha = parseInt(v.substr(7, 2), 16);
        }
        return color;
    }
    exports.bgColorfromHex = bgColorfromHex;
    /**
     * 从"{"red":54,"green":41,"blue":123,"alpha":255}" 转成 #36297b6b
     * @param v
     */
    function hexFromBgColor(v) {
        var color = "#" + v.red.toString(16) + v.green.toString(16) + v.blue.toString(16);
        if (v.alpha != exports.GB_MAX_VALUE) {
            color += v.alpha.toString(16);
        }
        return color;
    }
    exports.hexFromBgColor = hexFromBgColor;
    /**
     * 从"{"red":54,"green":41,"blue":123,"alpha":255}" 转成 rgb(54,41,123)
     * @param v
     */
    function rgbFromBgColor(v) {
        if (v.alpha != exports.GB_MAX_VALUE) {
            return "rgba(" + v.red + "," + v.green + "," + v.blue + "," + v.alpha / exports.GB_MAX_VALUE + ")";
        }
        else {
            return "rgb(" + v.red + "," + v.green + "," + v.blue + ")";
        }
    }
    exports.rgbFromBgColor = rgbFromBgColor;
    function random255() {
        return Math.round(Math.random() * 255);
    }
    exports.random255 = random255;
    function randomColor() {
        return hexFromBgColor({
            red: random255(),
            green: random255(),
            blue: random255(),
            alpha: random255()
        });
    }
    exports.randomColor = randomColor;
});
