define(["require", "exports", "../mve-DOM/DOM", "../mve-DOM/index", "../mve/util"], function (require, exports, DOM, index_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.codeJar = void 0;
    /**
     * 固定参数，返回一个延时函数
     * @param cb
     * @param wait
     */
    function debounce(cb, wait) {
        var timeOut = 0;
        return function () {
            var ts = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                ts[_i] = arguments[_i];
            }
            clearTimeout(timeOut);
            timeOut = setTimeout(function () {
                cb.apply(void 0, ts);
            }, wait);
        };
    }
    function shouldRecord(e) {
        return !isUndo(e)
            && !isRedo(e)
            && !DOM.keyCode.META(e)
            && !DOM.keyCode.CONTROL(e)
            && !DOM.keyCode.ALT(e)
            && !DOM.keyCode.ARROWDOWN(e)
            && !DOM.keyCode.ARROWLEFT(e)
            && !DOM.keyCode.ARROWUP(e)
            && !DOM.keyCode.ARROWDOWN(e);
    }
    /**
     * 光标前的内容
     * @param editor
     */
    function beforeCursor(editor) {
        var s = window.getSelection();
        var r0 = s.getRangeAt(0);
        var r = document.createRange();
        r.selectNodeContents(editor);
        r.setEnd(r0.startContainer, r0.startOffset);
        return r.toString();
    }
    /**
     * 光标后的内容
     * @param editor
     */
    function afterCursor(editor) {
        var s = window.getSelection();
        var r0 = s.getRangeAt(0);
        var r = document.createRange();
        r.selectNodeContents(editor);
        r.setStart(r0.endContainer, r0.endOffset);
        return r.toString();
    }
    /**
     * 寻找字符串从某一点开始的空格或tab
     * @param text
     * @param from
     */
    function findPadding(text, from) {
        if (from === void 0) { from = 0; }
        var j = from;
        while (j < text.length && /[ \t]/.test(text[j])) {
            j++;
        }
        return [text.substring(from, j), from, j];
    }
    /***
     * 换行或shift+tab时计算行前的空格与位置
     */
    function findBeforePadding(beforeText) {
        var i = beforeText.lastIndexOf('\n') + 1;
        return findPadding(beforeText, i);
    }
    /**
     * 新行。需要与上一行的tab对齐
     * @param editor
     * @param indentOn
     * @param tab
     * @param e
     */
    function handleNewLine(editor, indentOn, tab, e) {
        var before = beforeCursor(editor);
        var after = afterCursor(editor);
        var padding = findBeforePadding(before)[0];
        var newLinePadding = padding;
        if (indentOn.test(before)) {
            newLinePadding += tab;
        }
        if (mb.browser.type == "FF" || newLinePadding.length > 0) {
            mb.DOM.preventDefault(e);
            insert('\n' + newLinePadding);
        }
        if (newLinePadding != padding && after[0] == "}") {
            var pos = mb.DOM.getSelectionRange(editor);
            insert("\n" + padding);
            mb.DOM.setSelectionRange(editor, pos);
        }
    }
    /**
     * 补全括号等
     * @param editor
     * @param e
     */
    function handleSelfClosingCharacters(editor, e, closePair) {
        var codeBefore = beforeCursor(editor);
        var codeAfter = afterCursor(editor);
        if (codeBefore.substr(codeBefore.length - 1) != '\\') {
            var end = closePair.find(function (v) { return v[1] == e.key; });
            if (end && codeAfter.substr(0, 1) == e.key) {
                //后继已为某括号，不输入
                var pos = mb.DOM.getSelectionRange(editor);
                mb.DOM.preventDefault(e);
                pos.start = ++pos.end;
                mb.DOM.setSelectionRange(editor, pos);
            }
            else {
                var begin = closePair.find(function (v) { return v[0] == e.key; });
                if (begin) {
                    //匹配某括号，不插入
                    var pos = mb.DOM.getSelectionRange(editor);
                    mb.DOM.preventDefault(e);
                    var text = e.key + begin[1];
                    insert(text);
                    pos.start = ++pos.end;
                    mb.DOM.setSelectionRange(editor, pos);
                }
            }
        }
    }
    /**
     * 删除tab
     * @param editor
     * @param start
     * @param padding
     * @param tab
     * @returns
     */
    function deleteTab(editor, start, padding, tab) {
        var len = Math.min(tab.length, padding.length);
        if (len > 0) {
            mb.DOM.setSelectionRange(editor, { start: start, end: start + len }).deleteFromDocument();
        }
        return len;
    }
    /**
     * 输入tab
     * @param editor
     * @param tab
     * @param e
     */
    function handleTabCharacters(editor, tab, e) {
        mb.DOM.preventDefault(e);
        var selection = window.getSelection();
        var selected = selection.toString();
        if (selected.length > 0) {
            //多行
            var pos = mb.DOM.getSelectionRange(editor);
            var before = beforeCursor(editor);
            var _a = findBeforePadding(before), padding = _a[0], start = _a[1];
            var inlines = selected.split('\n');
            if (e.shiftKey) {
                //删除
                //第一行
                var firstLine = before.substr(start) + inlines[0];
                var vpadding = findPadding(firstLine)[0];
                var di = deleteTab(editor, start, vpadding, tab);
                var nstart = start + firstLine.length + 1 - di;
                //开始减去，如果选中包含减去，则不减
                var beginSub = Math.min(padding.length, tab.length);
                var endSub = di;
                //中间行
                var i = 1, end = inlines.length - 1;
                while (i < end) {
                    var vpadding_1 = findPadding(inlines[i])[0];
                    var di_1 = deleteTab(editor, nstart, vpadding_1, tab);
                    nstart = nstart + inlines[i].length + 1 - di_1;
                    endSub = endSub + di_1;
                    i++;
                }
                if (end != 0) {
                    //最后一行
                    var after = afterCursor(editor);
                    var lastLine = inlines[end] + after.substr(0, after.indexOf('\n'));
                    var vpadding_2 = findPadding(lastLine)[0];
                    endSub = endSub + deleteTab(editor, nstart, vpadding_2, tab);
                }
                if (pos.start < pos.end) {
                    pos.start -= beginSub;
                    pos.end -= endSub;
                }
                else {
                    pos.end -= beginSub;
                    pos.start -= endSub;
                }
                mb.DOM.setSelectionRange(editor, pos);
            }
            else {
                //插入
                //第一行
                mb.DOM.setSelectionRange(editor, { start: start, end: start });
                insert(tab);
                var nstart = before.length + inlines[0].length + tab.length + 1;
                //其它行
                var i = 1;
                while (i < inlines.length) {
                    mb.DOM.setSelectionRange(editor, { start: nstart, end: nstart });
                    insert(tab);
                    nstart = nstart + inlines[i].length + tab.length + 1;
                    i++;
                }
                if (pos.start < pos.end) {
                    pos.start = pos.start + tab.length;
                    pos.end = pos.end + (tab.length * inlines.length);
                }
                else {
                    pos.start = pos.start + (tab.length * inlines.length);
                    pos.end = pos.end + tab.length;
                }
                mb.DOM.setSelectionRange(editor, pos);
            }
        }
        else {
            //单行
            if (e.shiftKey) {
                var before = beforeCursor(editor);
                var _b = findBeforePadding(before), padding = _b[0], start = _b[1];
                if (padding.length > 0) {
                    var pos = mb.DOM.getSelectionRange(editor);
                    var len = deleteTab(editor, start, padding, tab);
                    pos.start -= len;
                    pos.end -= len;
                    mb.DOM.setSelectionRange(editor, pos);
                }
            }
            else {
                insert(tab);
            }
        }
    }
    /**
     * 记录历史
     * @param editor
     * @param history
     * @param focus
     * @param at
     * @returns 返回at
     */
    function recordHistory(editor, history, focus, at) {
        if (!focus)
            return at;
        var html = editor.innerHTML;
        var pos = mb.DOM.getSelectionRange(editor);
        var lastRecord = history[at];
        if (lastRecord
            && lastRecord.html == html
            && lastRecord.pos.start == pos.start
            && lastRecord.pos.end == pos.end)
            return at;
        at++;
        history[at] = { html: html, pos: pos };
        history.splice(at + 1);
        var maxHistory = 300;
        if (at > maxHistory) {
            at = maxHistory;
            history.splice(0, 1);
        }
        return at;
    }
    /**
     * 处理粘贴
     * @param editor
     * @param hightlight
     * @param e
     */
    function handlePaste(editor, hightlight, e) {
        mb.DOM.preventDefault(e);
        var text = (e.originalEvent || e).clipboardData.getData("text/plain");
        var pos = mb.DOM.getSelectionRange(editor);
        insert(text);
        hightlight(editor, pos);
        mb.DOM.setSelectionRange(editor, {
            start: pos.start + text.length,
            end: pos.start + text.length
        });
    }
    function isCtrl(e) {
        return e.metaKey || e.ctrlKey;
    }
    function isUndo(e) {
        return isCtrl(e) && !e.shiftKey && DOM.keyCode.Z(e);
    }
    function isRedo(e) {
        return isCtrl(e) && e.shiftKey && DOM.keyCode.Z(e);
    }
    function insert(text) {
        text = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        document.execCommand("insertHTML", false, text);
    }
    function codeJar(p) {
        p.tab = p.tab || "\t";
        p.indentOn = p.indentOn || /{$/;
        p.closePair = p.closePair || ["()", "[]", '{}', '""', "''"];
        var vm = {
            tab: util_1.mve.valueOrCall(p.tab),
            indentOn: util_1.mve.valueOrCall(p.indentOn),
            spellcheck: util_1.mve.valueOrCall(p.spellcheck),
            noClosing: util_1.mve.valueOrCall(p.noClosing),
            closePair: util_1.mve.valueOrCall(p.closePair),
            content: util_1.mve.valueOrCall(p.content || '')
        };
        var editor;
        var debounceHighlight = debounce(function () {
            var pos = mb.DOM.getSelectionRange(editor);
            p.highlight(editor, pos);
            mb.DOM.setSelectionRange(editor, pos);
        }, 30);
        var recording = false;
        var debounceRecordHistory = debounce(function (event) {
            if (shouldRecord(event)) {
                //记录keydown-up之间的改变。
                at = recordHistory(editor, history, focus, at);
                recording = false;
            }
        }, 300);
        var history = [];
        var at = -1;
        var focus = false;
        //代码之前的鼠标事件
        var prev;
        var jar = {
            getContent: function () {
                return editor.textContent || "";
            },
            getSelection: function () {
                return mb.DOM.getSelectionRange(editor);
            },
            setSelection: function (v) {
                mb.DOM.setSelectionRange(editor, v);
            }
        };
        function orCallback() {
            if (p.callback) {
                p.callback(jar.getContent());
            }
        }
        var element = p.element || {
            type: "pre"
        };
        element.action = element.action || {};
        var action = element.action;
        index_1.reWriteAction(action, 'keydown', function (vs) {
            vs.push(function (e) {
                if (e.defaultPrevented)
                    return;
                prev = jar.getContent();
                if (DOM.keyCode.ENTER(e)) {
                    //换行
                    handleNewLine(editor, vm.indentOn(), vm.tab(), e);
                }
                else if (DOM.keyCode.TAB(e)) {
                    //缩进与反缩进
                    handleTabCharacters(editor, vm.tab(), e);
                }
                else if (isUndo(e)) {
                    //撤销
                    mb.DOM.preventDefault(e);
                    at--;
                    var record = history[at];
                    if (record) {
                        editor.innerHTML = record.html;
                        //会对history的record产生副作用
                        mb.DOM.setSelectionRange(editor, record.pos);
                    }
                    if (at < 0) {
                        at = 0;
                    }
                }
                else if (isRedo(e)) {
                    //重做
                    mb.DOM.preventDefault(e);
                    at++;
                    var record = history[at];
                    if (record) {
                        editor.innerHTML = record.html;
                        //会对history的record产生副作用
                        mb.DOM.setSelectionRange(editor, record.pos);
                    }
                    if (at >= history.length) {
                        at--;
                    }
                }
                else if (!p.noClosing) {
                    //补全括号
                    handleSelfClosingCharacters(editor, e, vm.closePair());
                }
                if (shouldRecord(e) && !recording) {
                    at = recordHistory(editor, history, focus, at);
                    recording = true;
                }
            });
            return vs;
        });
        index_1.reWriteAction(action, 'keyup', function (vs) {
            vs.unshift(function (e) {
                if (e.defaultPrevented)
                    return;
                if (e.isComposing)
                    return;
                if (prev != jar.getContent()) {
                    debounceHighlight();
                }
                debounceRecordHistory(e);
                orCallback();
            });
            return vs;
        });
        index_1.reWriteAction(action, 'focus', function (vs) {
            vs.push(function (e) {
                focus = true;
            });
            return vs;
        });
        index_1.reWriteAction(action, 'blur', function (vs) {
            vs.push(function (e) {
                focus = false;
            });
            return vs;
        });
        index_1.reWriteAction(action, 'paste', function (vs) {
            vs.push(function (e) {
                at = recordHistory(editor, history, focus, at);
                handlePaste(editor, p.highlight, e);
                at = recordHistory(editor, history, focus, at);
                orCallback();
            });
            return vs;
        });
        element.id = function (v) {
            editor = v;
            if (p.id) {
                p.id(jar);
            }
        };
        element.attr = mb.Object.ember(element.attr || {}, {
            contentEditable: mb.Object.reDefine(p.readonly, function (r) {
                if (typeof (r) == 'function') {
                    return function () {
                        return r() ? undefined : mb.DOM.contentEditable.text;
                    };
                }
                else {
                    return r ? undefined : mb.DOM.contentEditable.text;
                }
            }),
            spellcheck: p.spellcheck
        });
        element.text = util_1.mve.delaySetAfter(vm.content, function (content, set) {
            if (content != jar.getContent()) {
                set(content);
                p.highlight(editor, jar.getSelection());
            }
        });
        element.style = mb.Object.ember(element.style || {}, {
            outline: "none",
            "overflow-wrap": "break-word",
            "overflow-y": "auto",
            resize: p.height ? "none" : "vertical",
            "white-space": "pre-wrap",
            width: mb.Object.reDefine(p.width, function (w) {
                if (typeof (w) == 'function') {
                    return function () {
                        return w() + "px";
                    };
                }
                else {
                    return w + "px";
                }
            }),
            height: mb.Object.reDefine(p.height, function (height) {
                if (typeof (height) == 'function') {
                    return function () {
                        return height() + "px";
                    };
                }
                else {
                    return height + "px";
                }
            })
        });
        return element;
    }
    exports.codeJar = codeJar;
});
