define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.html = exports.value = exports.content = exports.text = exports.event = exports.prop = exports.style = exports.attr = exports.empty = exports.removeChild = exports.insertChildBefore = exports.replaceWith = exports.appendChild = exports.createTextNode = exports.createElementNS = exports.createElement = exports.keyCode = exports.revertAfterMove = exports.saveBeforeMove = void 0;
    function findScroll(el, store) {
        if (el.scrollTop != 0 || el.scrollLeft != 0) {
            var keep = {
                el: el,
                top: el.scrollTop,
                left: el.scrollLeft
            };
            store.push(keep);
        }
        for (var i = 0; i < el.children.length; i++) {
            findScroll(el.children[i], store);
        }
    }
    function keepScroll(el) {
        var store = [];
        findScroll(el, store);
        return store;
    }
    function reverScroll(store) {
        for (var _i = 0, store_1 = store; _i < store_1.length; _i++) {
            var scrollKeep = store_1[_i];
            scrollKeep.el.scrollTop = scrollKeep.top;
            scrollKeep.el.scrollLeft = scrollKeep.left;
        }
    }
    function notEqual(a, b) {
        return a != b || (typeof (b) != "string" && a != b + "");
    }
    function isKey(v, key) {
        return function (e) {
            return e.keyCode == v;
        };
    }
    /**保存如滚动之类，在从DOM上剪切移动之前 */
    exports.saveBeforeMove = keepScroll;
    /**恢复如滚动之类，在从DOM上剪切移动之后 */
    exports.revertAfterMove = reverScroll;
    exports.keyCode = {
        BACKSPACE: isKey(8, "Backspace"),
        ENTER: isKey(13, "Enter"),
        TAB: isKey(9, "Tab"),
        ARROWLEFT: isKey(37, "ArrowLeft"),
        ARROWUP: isKey(38, "ArrowUp"),
        ARROWRIGHT: isKey(39, "ArrowRight"),
        ARROWDOWN: isKey(40, "ArrowDown"),
        CONTROL: isKey(17, "Control"),
        /**windows键 */
        META: isKey(91, "Meta"),
        ALT: isKey(18, "ALT"),
        A: isKey(65, 'a'),
        Z: isKey(90, "z"),
        V: isKey(86, "v"),
        C: isKey(67, "c"),
        X: isKey(88, "x")
    };
    function createElement(type) {
        return document.createElement(type);
    }
    exports.createElement = createElement;
    function createElementNS(type, NS) {
        return document.createElementNS(NS, type);
    }
    exports.createElementNS = createElementNS;
    function createTextNode(json) {
        return document.createTextNode(json);
    }
    exports.createTextNode = createTextNode;
    function appendChild(el, child, isMove) {
        if (isMove) {
            var o = keepScroll(child);
            el.appendChild(child);
            reverScroll(o);
        }
        else {
            el.appendChild(child);
        }
    }
    exports.appendChild = appendChild;
    function replaceWith(el, newEL) {
        var pN = el.parentNode;
        if (pN) {
            pN.replaceChild(newEL, el);
        }
    }
    exports.replaceWith = replaceWith;
    function insertChildBefore(pel, new_el, old_el, isMove) {
        if (isMove) {
            var oo = keepScroll(old_el);
            var no = keepScroll(new_el);
            pel.insertBefore(new_el, old_el);
            reverScroll(oo);
            reverScroll(no);
        }
        else {
            pel.insertBefore(new_el, old_el);
        }
    }
    exports.insertChildBefore = insertChildBefore;
    function removeChild(el, child) {
        el.removeChild(child);
    }
    exports.removeChild = removeChild;
    function empty(el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }
    exports.empty = empty;
    function attr(el, key, value) {
        var attr = el.getAttribute(key);
        if (notEqual(attr, value)) {
            if (value == undefined) {
                el.removeAttribute(key);
            }
            else {
                el.setAttribute(key, value);
            }
        }
    }
    exports.attr = attr;
    function style(el, key, value) {
        //IE下如果设置负值，会导致错误
        try {
            if (notEqual(el.style[key], value)) {
                el.style[key] = value;
            }
        }
        catch (e) {
            console.warn(e);
        }
    }
    exports.style = style;
    function prop(el, key, value) {
        if (notEqual(el[key], value)) {
            el[key] = value;
        }
    }
    exports.prop = prop;
    function event(el, key, value) {
        if (typeof (value) == "function") {
            mb.DOM.addEvent(el, key, value);
        }
        else if (value) {
            mb.DOM.addEvent(el, key, value.handler, value);
        }
    }
    exports.event = event;
    function text(el, value) {
        if (notEqual(el.innerText, value)) {
            el.innerText = value;
        }
    }
    exports.text = text;
    function content(el, value) {
        if (notEqual(el.textContent, value)) {
            el.textContent = value;
        }
    }
    exports.content = content;
    function value(el, value) {
        if (notEqual(el.value, value)) {
            el.value = value;
        }
    }
    exports.value = value;
    function html(el, value) {
        if (notEqual(el.innerHTML, value)) {
            el.innerHTML = value;
        }
    }
    exports.html = html;
});
