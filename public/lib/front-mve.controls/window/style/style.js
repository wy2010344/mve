define(["require", "exports", "../../../front-lib/jsdom", "../../../mve/util"], function (require, exports, jsdom, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.gstate = exports.loadStyle = void 0;
    var h = (new Date()).getHours();
    var state = false;
    if (7 < h && h < 20) {
        //7~8点，白天
        state = true;
    }
    var oldel;
    function loadStyle(bool) {
        var style = bool ? "day" : "night";
        /**
        感觉还是非常需要class这种css属性。
        如果全靠js，则需要写太多代码，而不是将影响集中。
        css用class过滤，是将结果集中。
        js用标识判断，是将原因集中（全局的状态）
        */
        var el = jsdom.parseElement({
            type: "link",
            attr: {
                rel: "stylesheet",
                type: "text/css",
                href: pathOf("./" + style + ".css?v=" + (new Date()))
            }
        });
        if (oldel) {
            document.body.removeChild(oldel);
        }
        oldel = el;
        document.body.appendChild(el);
    }
    exports.loadStyle = loadStyle;
    ;
    loadStyle(state);
    exports.gstate = util_1.mve.valueOf(state);
    exports.gstate["color"] = function () {
        //前景色
        return exports.gstate() ? "black" : "white";
    };
    exports.gstate["background-color"] = function () {
        //后景色
        return exports.gstate() ? "white" : "black";
    };
});
