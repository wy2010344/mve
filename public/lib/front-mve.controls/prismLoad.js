define(["require", "exports", "../mve/util"], function (require, exports, util_1) {
    "use strict";
    function addLink(href, onLoad) {
        var link = document.createElement("link");
        link.href = href;
        link.rel = "stylesheet";
        link.onload = onLoad;
        document.head.appendChild(link);
        return link;
    }
    function addScript(src, onLoad) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = src;
        script.onload = onLoad;
        document.head.appendChild(script);
        return script;
    }
    function linkLoader(href) {
        return function (notice) {
            return addLink(href, notice);
        };
    }
    function scriptLoadr(src) {
        return function (notice) {
            return addScript(src, notice);
        };
    }
    var prefix = "https://unpkg.com/prismjs@1.23.0/";
    return mb.ajax.require.async(function (notice) {
        mb.task.all({
            data: mb.Array.toObject([
                scriptLoadr(prefix + "components/prism-core.min.js"),
                scriptLoadr(prefix + "plugins/autoloader/prism-autoloader.min.js"),
                scriptLoadr(prefix + "components.js")
            ], function (v, i) { return [i + "", v]; }),
            success: function (v) {
                var theme;
                var themeValue = util_1.mve.valueOf("");
                function loadTheme(key) {
                    if (arguments.length == 0) {
                        return themeValue();
                    }
                    else {
                        var key_1 = arguments[0];
                        themeValue(key_1);
                        var href = prefix + "themes/" + key_1 + ".css";
                        if (theme) {
                            theme.href = href;
                        }
                        else {
                            theme = addLink(href);
                        }
                    }
                }
                notice({
                    Prism: window["Prism"],
                    components: window["components"],
                    theme: loadTheme,
                    ifLoadTheme: function (key) {
                        if (themeValue() == "") {
                            loadTheme(key || "prism-dark");
                        }
                    }
                });
            }
        });
    });
});
