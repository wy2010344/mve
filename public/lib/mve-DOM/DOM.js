define(["require", "exports"], function (require, exports) {
    "use strict";
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
        mb.Array.forEach(store, function (scrollKeep) {
            scrollKeep.el.scrollTop = scrollKeep.top;
            scrollKeep.el.scrollLeft = scrollKeep.left;
        });
    }
    function notEqual(a, b) {
        return a != b || (typeof (b) != "string" && a != b + "");
    }
    return {
        createElement: function (type) {
            return document.createElement(type);
        },
        createElementNS: function (type, NS) {
            return document.createElementNS(NS, type);
        },
        createTextNode: function (json) {
            return document.createTextNode(json);
        },
        appendChild: function (el, child, isMove) {
            if (isMove) {
                var o = keepScroll(child);
                el.appendChild(child);
                reverScroll(o);
            }
            else {
                el.appendChild(child);
            }
        },
        replaceWith: function (el, newEL) {
            var pN = el.parentNode;
            if (pN) {
                pN.replaceChild(newEL, el);
            }
        },
        insertChildBefore: function (pel, new_el, old_el, isMove) {
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
        },
        removeChild: function (el, child) {
            el.removeChild(child);
        },
        empty: function (el) {
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
        },
        attr: function (el, key, value) {
            var attr = el.getAttribute(key);
            if (notEqual(attr, value)) {
                if (value == undefined) {
                    el.removeAttribute(key);
                }
                else {
                    el.setAttribute(key, value);
                }
            }
        },
        style: function (el, key, value) {
            //IE下如果设置负值，会导致错误
            try {
                if (notEqual(el.style[key], value)) {
                    el.style[key] = value;
                }
            }
            catch (e) {
                mb.log(e);
            }
        },
        prop: function (el, key, value) {
            if (notEqual(el[key], value)) {
                el[key] = value;
            }
        },
        action: function (el, key, value) {
            if (typeof (value) == "function") {
                mb.DOM.addEvent(el, key, value);
            }
            else {
                mb.DOM.addEvent(el, key, value.handler, value);
            }
        },
        text: function (el, value) {
            if (notEqual(el.innerText, value)) {
                el.innerText = value;
            }
        },
        content: function (el, value) {
            if (notEqual(el.textContent, value)) {
                el.textContent = value;
            }
        },
        value: function (el, value) {
            if (notEqual(el.value, value)) {
                el.value = value;
            }
        },
        html: function (el, value) {
            if (notEqual(el.innerHTML, value)) {
                el.innerHTML = value;
            }
        }
    };
});
