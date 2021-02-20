define(["require", "exports", "../mve/util"], function (require, exports, util_1) {
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
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            clearTimeout(timeOut);
            timeOut = setTimeout(function () {
                cb.apply(void 0, args);
            }, wait);
        };
    }
    function shouldRecord(e) {
        return !isUndo(e)
            && !isRedo(e)
            && e.key != "Meta"
            && e.key != "Control"
            && e.key != "Alt"
            && !e.key.startsWith("Arrow");
    }
    /**
     * 深度遍历，先子后弟
     * @param editor
     * @param visitor
     */
    function visit(editor, visitor) {
        var queue = [];
        if (editor.firstChild) {
            queue.push(editor.firstChild);
        }
        var el = queue.pop();
        while (el) {
            if (visitor(el)) {
                break;
            }
            if (el.nextSibling) {
                queue.push(el.nextSibling);
            }
            if (el.firstChild) {
                queue.push(el.firstChild);
            }
            el = queue.pop();
        }
    }
    /**
     * 保存选中位置
     * anchor开始点，focus结束点
     */
    function save(editor) {
        var s = window.getSelection();
        var pos = { start: 0, end: 0 };
        visit(editor, function (el) {
            if (el.nodeType != Node.TEXT_NODE)
                return;
            if (el == s.anchorNode) {
                if (el == s.focusNode) {
                    pos.start += s.anchorOffset;
                    pos.end += s.focusOffset;
                    pos.dir = s.anchorOffset <= s.focusOffset ? "->" : "<-";
                    return true;
                }
                else {
                    pos.start += s.anchorOffset;
                    if (pos.dir) {
                        return true;
                    }
                    else {
                        //选遇到开始点
                        pos.dir = "->";
                    }
                }
            }
            else if (el == s.focusNode) {
                pos.end += s.focusOffset;
                if (pos.dir) {
                    return true;
                }
                else {
                    //先遇到结束点
                    pos.dir = "<-";
                }
            }
            if (el.nodeType == Node.TEXT_NODE) {
                var len = (el.nodeValue || "").length;
                if (pos.dir != "->") {
                    pos.start += len;
                }
                if (pos.dir != "<-") {
                    pos.end += len;
                }
            }
        });
        return pos;
    }
    function restoreVerifyPos(pos) {
        var _a;
        var dir = pos.dir;
        var start = pos.start;
        var end = pos.end;
        if (!dir) {
            dir = "->";
        }
        if (start < 0) {
            start = 0;
        }
        if (end < 0) {
            end = 0;
        }
        if (dir == "<-") {
            //交换开始与结束的位置，以便顺序遍历
            _a = [end, start], start = _a[0], end = _a[1];
        }
        return [start, end, dir];
    }
    /**
     * 恢复选中位置
     * @param editor
     * @param pos
     */
    function restore(editor, pos) {
        var _a;
        var s = window.getSelection();
        var startNode, startOffset = 0;
        var endNode, endOffset = 0;
        var _b = restoreVerifyPos(pos), start = _b[0], end = _b[1], dir = _b[2];
        var current = 0;
        visit(editor, function (el) {
            if (el.nodeType != Node.TEXT_NODE)
                return;
            var len = (el.nodeValue || "").length;
            if (current + len >= start) {
                if (!startNode) {
                    startNode = el;
                    startOffset = start - current;
                }
                if (current + len >= end) {
                    endNode = el;
                    endOffset = end - current;
                    return true;
                }
            }
            current += len;
        });
        if (!startNode) {
            startNode = editor;
        }
        if (!endNode) {
            endNode = editor;
        }
        if (dir == "<-") {
            _a = [endNode, endOffset, startNode, startOffset], startNode = _a[0], startOffset = _a[1], endNode = _a[2], endOffset = _a[3];
        }
        s.setBaseAndExtent(startNode, startOffset, endNode, endOffset);
        return s;
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
     * 寻找字符串从某一点开始的空格
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
            var pos = save(editor);
            insert("\n" + padding);
            restore(editor, pos);
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
                var pos = save(editor);
                mb.DOM.preventDefault(e);
                pos.start = ++pos.end;
                restore(editor, pos);
            }
            else {
                var begin = closePair.find(function (v) { return v[0] == e.key; });
                if (begin) {
                    //匹配某括号，不插入
                    var pos = save(editor);
                    mb.DOM.preventDefault(e);
                    var text = e.key + begin[1];
                    insert(text);
                    pos.start = ++pos.end;
                    restore(editor, pos);
                }
            }
        }
    }
    function deleteTab(editor, start, padding, tab) {
        var len = Math.min(tab.length, padding.length);
        if (len > 0) {
            restore(editor, { start: start, end: start + len }).deleteFromDocument();
        }
        return len;
    }
    function handleTabCharacters(editor, tab, e) {
        mb.DOM.preventDefault(e);
        var selection = window.getSelection();
        var selected = selection.toString();
        if (selected.length > 0) {
            //多行
            var pos = save(editor);
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
                restore(editor, pos);
            }
            else {
                //插入
                //第一行
                restore(editor, { start: start, end: start });
                insert(tab);
                var nstart = before.length + inlines[0].length + tab.length + 1;
                //其它行
                var i = 1;
                while (i < inlines.length) {
                    restore(editor, { start: nstart, end: nstart });
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
                restore(editor, pos);
            }
        }
        else {
            //单行
            if (e.shiftKey) {
                var before = beforeCursor(editor);
                var _b = findBeforePadding(before), padding = _b[0], start = _b[1];
                if (padding.length > 0) {
                    var pos = save(editor);
                    var len = deleteTab(editor, start, padding, tab);
                    pos.start -= len;
                    pos.end -= len;
                    restore(editor, pos);
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
        var pos = save(editor);
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
    function handlePaste(editor, hightlight, e) {
        mb.DOM.preventDefault(e);
        var text = (e.originalEvent || e).clipboardData.getData("text/plain");
        var pos = save(editor);
        insert(text);
        hightlight(editor);
        restore(editor, {
            start: pos.start + text.length,
            end: pos.start + text.length
        });
    }
    function isCtrl(e) {
        return e.metaKey || e.ctrlKey;
    }
    function isUndo(e) {
        return isCtrl(e) && !e.shiftKey && e.key.toLocaleLowerCase() == 'z';
    }
    function isRedo(e) {
        return isCtrl(e) && e.shiftKey && e.key.toLocaleLowerCase() == 'z';
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
    var contentEditable = mb.browser.type == "FF" ? "true" : "plaintext-only";
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
            content: util_1.mve.valueOrCall(p.content)
        };
        var editor;
        var debounceHighlight = debounce(function () {
            var pos = save(editor);
            p.highlight(editor);
            restore(editor, pos);
        }, 30);
        var recording = false;
        var debounceRecordHistory = debounce(function (event) {
            if (shouldRecord(event)) {
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
            }
        };
        function orCallback() {
            if (p.callback) {
                p.callback(jar.getContent());
            }
        }
        return {
            type: p.type || "div",
            id: function (v) {
                editor = v;
                if (p.id) {
                    p.id(jar);
                }
            },
            attr: {
                contentEditable: util_1.mve.reWriteMTValue(p.readonly, function (b) {
                    return b ? undefined : contentEditable;
                }) || contentEditable,
                spellcheck: p.spellcheck
            },
            text: util_1.mve.delaySetAfter(vm.content, function (content, set) {
                if (content != jar.getContent()) {
                    set(content);
                    p.highlight(editor);
                }
            }),
            cls: p.cls,
            style: {
                outline: "none",
                "overflow-wrap": "break-word",
                "overflow-y": "auto",
                resize: p.height ? "none" : "vertical",
                "white-space": "pre-wrap",
                width: util_1.mve.reWriteMTValueNoWatch(p.width, function (v) { return v + "px"; }),
                height: util_1.mve.reWriteMTValueNoWatch(p.height, function (h) { return h + "px"; })
            },
            action: {
                keydown: function (e) {
                    if (e.defaultPrevented)
                        return;
                    prev = jar.getContent();
                    if (e.key == "Enter") {
                        //换行
                        handleNewLine(editor, vm.indentOn(), vm.tab(), e);
                    }
                    else if (e.key == "Tab") {
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
                            restore(editor, record.pos);
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
                            restore(editor, record.pos);
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
                },
                keyup: function (e) {
                    if (e.defaultPrevented)
                        return;
                    if (e.isComposing)
                        return;
                    if (prev != jar.getContent()) {
                        debounceHighlight();
                    }
                    debounceRecordHistory(e);
                    orCallback();
                },
                focus: function (e) {
                    focus = true;
                },
                blur: function (e) {
                    focus = false;
                },
                paste: function (e) {
                    at = recordHistory(editor, history, focus, at);
                    handlePaste(editor, p.highlight, e);
                    at = recordHistory(editor, history, focus, at);
                    orCallback();
                }
            }
        };
    }
    exports.codeJar = codeJar;
});
