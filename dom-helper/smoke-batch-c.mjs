/**
 * 批次 C 冒烟（node 直跑 dist，真实渲染管线 + CanvasKit 段落）：
 *   node smoke-batch-c.mjs
 *
 * 覆盖本批新增：
 * - Graphemes（Intl.Segmenter 字素簇边界）/ Words（词边界，Kotlin 直译）
 * - Focus 子系统（focusedSignal / requestFocus / isEditorHandle / clearFocus）
 * - Clipboard（内存剪贴板缓冲）
 * - EditableTextNode：输入 / 退格 / 撤销重做 / 全选 / 复制粘贴 /
 *   单行提交 / 多行换行 / 掩码字段 / 光标 SelPair
 * - Renderer 焦点派发：点击聚焦 + Tab / Shift+Tab 遍历（focusOrder 显式序）
 *
 * 垫片要点同 smoke-selection-integration.mjs：先无 document 初始化 CanvasKit，
 * 再打 DOM / rAF 垫片；canvas 用桩对象，事件用 dispatch 手动触发。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WASM_DIR = path.join(HERE, 'node_modules/canvaskit-wasm/bin');
const FONT_FILE = path.resolve(
  HERE,
  '../../../apps/mve-vite-demo/public/fonts/noto-sans-sc-chinese-simplified-400-normal.woff2'
);

// ---------- 1. 先初始化 CanvasKit（无 document → node 路径） ----------
const CK = await import('canvaskit-wasm');
const factory = CK.CanvasKitInit ?? CK.default;
const kit = await factory({ locateFile: f => path.join(WASM_DIR, f) });

// ---------- 2. DOM / rAF 垫片 ----------
globalThis.HTMLCanvasElement = class HTMLCanvasElement {};
globalThis.ImageData = class ImageData {
  constructor(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
};
/** 垫片创建的元素（textarea 用于模拟输入法组合事件） */
const createdElements = [];
globalThis.document = {
  createElement(tag) {
    const c = new globalThis.HTMLCanvasElement();
    c.tagName = String(tag ?? 'div').toUpperCase();
    c.width = 0;
    c.height = 0;
    c.getContext = () => ({ putImageData() {} });
    // 元素最小面 + 简易事件系统（node 垫片）
    c.setAttribute = () => {};
    c.style = {};
    c.value = '';
    c.selectionStart = 0;
    c.focused = false;
    const listeners = new Map();
    c.addEventListener = (type, fn) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    };
    c.removeEventListener = (type, fn) => {
      listeners.get(type)?.delete(fn);
    };
    c.dispatch = (type, event) => {
      listeners.get(type)?.forEach(fn => fn(event));
    };
    c.focus = () => {
      c.focused = true;
      globalThis.document.activeElement = c;
    };
    c.blur = () => {
      c.focused = false;
      if (globalThis.document.activeElement === c) {
        globalThis.document.activeElement = null;
      }
    };
    c.remove = () => {};
    createdElements.push(c);
    return c;
  },
  body: { appendChild() {} },
  head: { appendChild() {} },
  activeElement: null,
};
globalThis.window = globalThis;
globalThis.window.CanvasKitInit = async () => kit;

const rafQueue = [];
globalThis.requestAnimationFrame = cb => {
  rafQueue.push(cb);
  return rafQueue.length;
};
globalThis.cancelAnimationFrame = () => {};
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ---------- 3. mock 2D context ----------
let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  if (Object.is(actual, expected)) {
    passed++;
    console.log(`  ok ${name}`);
  } else {
    failed++;
    console.error(
      `  FAIL ${name}: 期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`
    );
  }
}

let currentFill = '';
const ctx2d = {
  set fillStyle(v) {
    currentFill = v;
  },
  get fillStyle() {
    return currentFill;
  },
  globalAlpha: 1,
  font: '',
  textBaseline: '',
  clearRect() {},
  save() {},
  restore() {},
  fillRect() {},
  drawImage() {},
  beginPath() {},
  closePath() {},
  moveTo() {},
  lineTo() {},
  arc() {},
  fill() {},
  stroke() {},
  clip() {},
  translate() {},
  scale() {},
  measureText: t => ({ width: String(t).length * 8 }),
};

function makeCanvasStub(w, h) {
  const listeners = new Map();
  const c = new globalThis.HTMLCanvasElement();
  c.clientWidth = w;
  c.clientHeight = h;
  c.width = w;
  c.height = h;
  c.style = {};
  c.getContext = () => ctx2d;
  c.addEventListener = (type, fn) => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(fn);
  };
  c.removeEventListener = (type, fn) => {
    listeners.get(type)?.delete(fn);
  };
  c.dispatch = (type, event) => {
    listeners.get(type)?.forEach(fn => fn(event));
  };
  return c;
}

async function flush() {
  for (let i = 0; i < 3; i++) {
    rafQueue.splice(0).forEach(cb => cb(Date.now()));
    await new Promise(r => setTimeout(r, 0));
  }
}

// ---------- 4. 加载 dist 产物 ----------
const { createSignal } = await import('wy-helper');
const { loadCanvasKit, registerFont } = await import('./dist/canvasRender.mjs');
const {
  renderCanvas,
  flex,
  nodeOf,
  node2,
  tfc,
  globalMouse2Context,
  rectNode,
  editableTextNode,
  Graphemes,
  Words,
  focusedSignal,
  activeEditorSignal,
  requestFocus,
  clearFocus,
  isEditorHandle,
  clipboardSetText,
  clipboardGetText,
} = await import('./dist/canvasRender2.mjs');

await loadCanvasKit('/canvas-kit/canvaskit.js');
registerFont('Noto Sans SC', readFileSync(FONT_FILE));

console.log('— Graphemes（字素簇边界）—');
check('nextBoundary(ascii)', Graphemes.nextBoundary('abc', 0), 1);
check('prevBoundary(ascii)', Graphemes.prevBoundary('abc', 2), 1);
check('nextBoundary 跨 emoji', Graphemes.nextBoundary('\u{1F680}x', 0), 2);
check('prevBoundary 跨 emoji', Graphemes.prevBoundary('\u{1F680}x', 2), 0);
check('clusterCount(emoji+x)', Graphemes.clusterCount('\u{1F680}x'), 2);
check('clusterCount(空串)', Graphemes.clusterCount(''), 0);
check('nextBoundary 文末', Graphemes.nextBoundary('ab', 2), 2);
check('prevBoundary 文首', Graphemes.prevBoundary('ab', 0), 0);

console.log('— Words（词边界）—');
check('isWordChar(字母)', Words.isWordChar('a'), true);
check('isWordChar(汉字)', Words.isWordChar('中'), true);
check('isWordChar(空格)', Words.isWordChar(' '), false);
check('isWordChar(标点)', Words.isWordChar('.'), false);
check('prevBoundary(词首)', Words.prevBoundary('hello world', 5), 0);
check('nextBoundary(词尾)', Words.nextBoundary('hello world', 0), 5);
check(
  'wordRangeAt(词中)',
  JSON.stringify(Words.wordRangeAt('hello world', 7)),
  '[6,11]'
);
check(
  'wordRangeAt(中文词)',
  JSON.stringify(Words.wordRangeAt('你好 世界', 1)),
  '[0,2]'
);
// 空白处：该空白簇自身算一个"词"（与 Kotlin 双击选词语义一致）
check(
  'wordRangeAt(空白)',
  JSON.stringify(Words.wordRangeAt('a b', 1)),
  '[1,2]'
);

console.log('— Clipboard —');
clipboardSetText('hello');
check('clipboardGetText 回读', clipboardGetText(), 'hello');

console.log('— Focus 子系统 —');
const probeNode = { focusable: true };
check('isEditorHandle(普通对象)', isEditorHandle(probeNode), false);
requestFocus(probeNode);
check('requestFocus 后 focusedSignal', focusedSignal.get(), probeNode);
check(
  'requestFocus 非编辑器不登记 activeEditor',
  activeEditorSignal.get(),
  null
);
clearFocus();
check('clearFocus 清空焦点', focusedSignal.get(), null);

// ---------- 5. 搭建真实渲染树（三个可聚焦编辑字段） ----------
const t1 = createSignal('');
const t2 = createSignal('');
const t3 = createSignal('');
let submitCount = 0;
const editors = [];

const canvasStub = makeCanvasStub(400, 400);

const field = (arg, i) =>
  nodeOf(n => {
    editors[i] = n;
    return editableTextNode.create({
      width: () => 300,
      height: () => 20,
      fontFamily: () => 'Noto Sans SC',
      fontSize: () => 14,
      ...arg,
    });
  });

const { selectionManager } = renderCanvas({
  canvas: canvasStub,
  layout: flex({ gap: 10 }),
  children: [
    field(
      {
        text: t1.get,
        onTextChange: v => t1.set(v),
        placeholder: () => '单行',
        singleLine: () => true,
        focusOrder: () => 1,
        onSubmit() {
          submitCount++;
        },
      },
      0
    ),
    field(
      {
        text: t2.get,
        onTextChange: v => t2.set(v),
        placeholder: () => '多行',
        focusOrder: () => 2,
      },
      1
    ),
    field(
      {
        text: t3.get,
        onTextChange: v => t3.set(v),
        placeholder: () => '掩码',
        singleLine: () => true,
        obscure: () => true,
        focusOrder: () => 3,
      },
      2
    ),
  ],
});

await flush();

const ed = editors[0];
const ed2 = editors[1];
const ed3 = editors[2];
check('编辑器节点已创建', editors.filter(Boolean).length, 3);
check('编辑器实现 EditableTextHandle', isEditorHandle(ed), true);

const key = (k, opts = {}) => ({
  key: k,
  code: opts.code ?? '',
  ctrl: !!opts.ctrl,
  shift: !!opts.shift,
  alt: false,
  meta: !!opts.meta,
});
const typeText = (editor, s) => {
  for (const ch of s) editor.handleKey(key(ch));
};

console.log('— EditableTextNode：输入 / 退格 / 撤销重做 —');
requestFocus(ed);
check('requestFocus 编辑器登记 activeEditor', activeEditorSignal.get(), ed);
check('未定位时光标 SelPair 为空', ed.cursorSelPair(), null);

typeText(ed, 'abc');
check('逐字输入', t1.get(), 'abc');
check('输入后光标 SelPair 非空', ed.cursorSelPair() != null, true);
ed.handleKey(key('', { code: 'Backspace' }));
check('退格删一个字素', t1.get(), 'ab');
ed.handleKey(key('z', { ctrl: true }));
check('Ctrl+Z 撤销退格', t1.get(), 'abc');
ed.handleKey(key('z', { ctrl: true, shift: true }));
check('Ctrl+Shift+Z 重做退格', t1.get(), 'ab');
ed.handleKey(key('y', { ctrl: true }));
check('重做栈已空时 Ctrl+Y 无变化', t1.get(), 'ab');

console.log('— EditableTextNode：全选 / 复制 / 粘贴 —');
ed.selectAll();
await flush();
check('全选后 selectedText', selectionManager.selectedText, t1.get());
ed.copy();
check('copy 写入剪贴板', clipboardGetText(), t1.get());
clipboardSetText('Z');
ed.paste();
check('paste 插入剪贴板内容', t1.get(), 'Z');
typeText(ed, 'xy');
check('粘贴后可继续输入', t1.get(), 'Zxy');

console.log('— EditableTextNode：单行提交 / 多行换行 —');
const before = t1.get();
ed.handleKey(key('', { code: 'Enter' }));
check('单行回车触发 onSubmit', submitCount, 1);
check('单行回车不插入换行', t1.get(), before);
requestFocus(ed2);
typeText(ed2, 'ab');
ed2.handleKey(key('', { code: 'Enter' }));
check('多行回车插入换行', t2.get(), 'ab\n');
ed2.handleKey(key('', { code: 'Enter', ctrl: true }));
check('多行 Ctrl+Enter 不插入换行', t2.get(), 'ab\n');

console.log('— EditableTextNode：掩码字段 —');
requestFocus(ed3);
typeText(ed3, 'abc');
check('掩码字段仍存明文', t3.get(), 'abc');
check('掩码字段文本长度可测', ed3.textLength(), 3);

console.log('— Renderer 焦点派发：点击聚焦 + Tab 遍历 —');
clearFocus();
canvasStub.dispatch('mousedown', {
  offsetX: 20,
  offsetY: 6,
  button: 0,
  shiftKey: false,
  preventDefault() {},
});
check('点击第一个字段聚焦', focusedSignal.get(), ed);
// 松手：否则指针会话一直"按住中"，按优先级 #1 会压制编辑器的 Ctrl+A 光标选区
canvasStub.dispatch('mouseup', {
  offsetX: 20,
  offsetY: 6,
  button: 0,
  shiftKey: false,
});
canvasStub.dispatch('keydown', {
  key: 'Tab',
  code: 'Tab',
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  preventDefault() {},
});
check('Tab 走到第二个字段', focusedSignal.get(), ed2);
canvasStub.dispatch('keydown', {
  key: 'Tab',
  code: 'Tab',
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  preventDefault() {},
});
check('Tab 走到第三个字段', focusedSignal.get(), ed3);
canvasStub.dispatch('keydown', {
  key: 'Tab',
  code: 'Tab',
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  preventDefault() {},
});
check('Tab 末尾回到第一个字段', focusedSignal.get(), ed);
canvasStub.dispatch('keydown', {
  key: 'Tab',
  code: 'Tab',
  shiftKey: true,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  preventDefault() {},
});
check('Shift+Tab 回退到第三个字段', focusedSignal.get(), ed3);

console.log('— Renderer 键盘快捷键：Ctrl+A / Ctrl+C —');
requestFocus(ed);
canvasStub.dispatch('keydown', {
  key: 'a',
  code: 'KeyA',
  shiftKey: false,
  ctrlKey: true,
  metaKey: false,
  altKey: false,
  preventDefault() {},
});
await flush();
check('Ctrl+A 全选编辑器文本', selectionManager.selectedText, t1.get());
clipboardSetText('');
canvasStub.dispatch('keydown', {
  key: 'c',
  code: 'KeyC',
  shiftKey: false,
  ctrlKey: true,
  metaKey: false,
  altKey: false,
  preventDefault() {},
});
check('Ctrl+C 复制选中文本', clipboardGetText(), t1.get());

console.log('— 修饰键不录入（Shift / CapsLock / F5）—');
t1.set('');
requestFocus(ed);
const modifierKey = (k, code, extra = {}) => ({
  key: k,
  code,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  preventDefault() {},
  ...extra,
});
canvasStub.dispatch('keydown', modifierKey('Shift', 'ShiftLeft'));
check('按 Shift 不录入文本', t1.get(), '');
canvasStub.dispatch('keydown', modifierKey('CapsLock', 'CapsLock'));
check('按 CapsLock 不录入文本', t1.get(), '');
canvasStub.dispatch('keydown', modifierKey('F5', 'F5'));
check('按 F5 不录入文本', t1.get(), '');
canvasStub.dispatch('keydown', modifierKey('ArrowLeft', 'ArrowLeft'));
check('方向键不录入文本', t1.get(), '');
canvasStub.dispatch('keydown', modifierKey('a', 'KeyA'));
check('普通字符仍可录入', t1.get(), 'a');
canvasStub.dispatch('keydown', modifierKey('A', 'KeyA', { shiftKey: true }));
check('大写字符正常录入', t1.get(), 'aA');

console.log('— 鼠标派发：capture → bubble + stopPropagation —');
const order = [];
const canvas2 = makeCanvasStub(200, 120);
const mouseEvent = (x, y, extra = {}) => ({
  offsetX: x,
  offsetY: y,
  button: 0,
  shiftKey: false,
  preventDefault() {},
  ...extra,
});
renderCanvas({
  canvas: canvas2,
  children: [
    rectNode.of({
      width: () => 200,
      height: () => 100,
      mouseDownCapture() {
        order.push('outer-capture');
      },
      mouseDown() {
        order.push('outer-bubble');
      },
      children: [
        rectNode.of({
          width: () => 100,
          height: () => 50,
          mouseDownCapture() {
            order.push('inner-capture');
          },
          mouseDown(e) {
            order.push('inner-bubble');
            e.stopPropagation();
          },
        }),
      ],
    }),
  ],
});
await flush();
canvas2.dispatch('mousedown', mouseEvent(10, 10));
check(
  'capture 自根向叶先于 bubble，stopPropagation 中断冒泡',
  order.join(','),
  'outer-capture,inner-capture,inner-bubble'
);

order.length = 0;
const canvas3 = makeCanvasStub(200, 120);
renderCanvas({
  canvas: canvas3,
  children: [
    rectNode.of({
      width: () => 200,
      height: () => 100,
      mouseDownCapture() {
        order.push('outer-capture');
      },
      mouseDown() {
        order.push('outer-bubble');
      },
      children: [
        rectNode.of({
          width: () => 100,
          height: () => 50,
          mouseDownCapture() {
            order.push('inner-capture');
          },
          mouseDown() {
            order.push('inner-bubble');
          },
        }),
      ],
    }),
  ],
});
await flush();
canvas3.dispatch('mousedown', mouseEvent(10, 10));
check(
  '不中断时完整顺序为 捕获(根→叶) + 冒泡(叶→根)',
  order.join(','),
  'outer-capture,inner-capture,inner-bubble,outer-bubble'
);

console.log('— 鼠标光标派生（CursorType）—');
const t4 = createSignal('');
const canvas4 = makeCanvasStub(200, 80);
renderCanvas({
  canvas: canvas4,
  layout: flex({ direction: 'y' }),
  children: [
    editableTextNode.of({
      text: t4.get,
      onTextChange: v => t4.set(v),
      width: () => 120,
      height: () => 20,
      fontFamily: () => 'Noto Sans SC',
      fontSize: () => 14,
    }),
    rectNode.of({
      width: () => 60,
      height: () => 20,
      focusable: () => true,
      background: () => 0xff000000,
    }),
  ],
});
await flush();
canvas4.dispatch('mousemove', mouseEvent(10, 10));
check('编辑器上光标为 text', canvas4.style.cursor, 'text');
const canvas4b = makeCanvasStub(200, 80);
renderCanvas({
  canvas: canvas4b,
  children: [
    rectNode.of({
      width: () => 60,
      height: () => 20,
      focusable: () => true,
      background: () => 0xff000000,
    }),
  ],
});
await flush();
canvas4b.dispatch('mousemove', mouseEvent(10, 10));
check('可聚焦节点上光标为 pointer', canvas4b.style.cursor, 'pointer');
canvas4.dispatch('mouseleave', {});
check('离开 canvas 光标复位 default', canvas4.style.cursor, 'default');

console.log('— GlobalMouse2：registerMouseDown —');
const canvas5 = makeCanvasStub(100, 60);
let globalMouse = null;
const probe = tfc(function (ctx, node) {
  globalMouse = ctx.consume(globalMouse2Context);
  return node2.create({
    width: () => 50,
    height: () => 20,
    acceptHit: () => true,
  });
});
renderCanvas({ canvas: canvas5, children: [probe.of()] });
await flush();
const downs = [];
const offDown = globalMouse?.registerMouseDown((x, y) => downs.push([x, y]));
canvas5.dispatch('mousedown', mouseEvent(7, 9));
check('registerMouseDown 收到按下坐标', JSON.stringify(downs), '[[7,9]]');
offDown?.();
canvas5.dispatch('mousedown', mouseEvent(8, 9));
check('注销后不再收到', downs.length, 1);

console.log('— 输入法（IME）组合：预编辑 → 上屏 —');
const imeTa = createdElements.find(el => el.tagName === 'TEXTAREA');
check('聚焦编辑器后创建了 IME textarea', !!imeTa, true);
check('IME textarea 已接管 DOM 焦点', imeTa?.focused, true);

t1.set('');
requestFocus(ed);
const dispatchComposition = (type, data) => {
  imeTa.value = data;
  imeTa.selectionStart = data.length;
  imeTa.dispatch(type, { data });
};
dispatchComposition('compositionstart', '');
dispatchComposition('compositionupdate', 'zhong');
check('预编辑串实时上屏', t1.get(), 'zhong');
dispatchComposition('compositionupdate', '中');
check('预编辑串替换（拼音→汉字）', t1.get(), '中');
// 组合期间的键盘事件归输入法独占，不进编辑器（key 通常为 'Process'）
imeTa.dispatch('keydown', modifierKey('Process', ''));
check('组合期间键盘不录入', t1.get(), '中');
dispatchComposition('compositionend', '中');
check('组合结束保留上屏文本', t1.get(), '中');
check('组合结束清空 textarea 缓冲', imeTa.value, '');
// 组合结束后键盘恢复
canvasStub.dispatch('keydown', modifierKey('w', 'KeyW'));
check('组合结束后可继续输入', t1.get(), '中w');

// 放弃组合：空串结束（如按 Esc 取消）
dispatchComposition('compositionstart', '');
dispatchComposition('compositionupdate', 'ni');
check('第二轮预编辑上屏', t1.get(), '中wni');
imeTa.value = '';
imeTa.dispatch('compositionend', { data: '' });
check('空串结束组合保留已上屏串', t1.get(), '中wni');

console.log('— EditableTextNode：上下键按行盒逐行移动（不跨行） —');
const vt = createSignal('aaa\nbbb\nccc\nddd\neee');
const vlh = createSignal(1);
let ved = null;
const vcanvas = makeCanvasStub(320, 300);
const { selectionManager: vsel } = renderCanvas({
  canvas: vcanvas,
  children: [
    nodeOf(n => {
      ved = n;
      return editableTextNode.create({
        width: () => 300,
        height: () => 120,
        fontFamily: () => 'Noto Sans SC',
        fontSize: () => 14,
        // 行高可调：1.0 时行高 < 光标 TIGHT 矩形高度，按"矩形高度"步进会跨两行
        lineHeightMultiplier: vlh.get,
        text: vt.get,
        onTextChange: v => vt.set(v),
      });
    }),
  ],
});
await flush();
requestFocus(ved);
const vkey = (code, extra = {}) => ({
  key: '',
  code,
  ctrl: false,
  shift: false,
  alt: false,
  meta: false,
  ...extra,
});
const vcaret = () => ved.cursorSelPair()?.focus.offset ?? -1;

ved.handleKey(vkey('Home', { ctrl: true }));
check('Ctrl+Home 回到文首', vcaret(), 0);
ved.handleKey(vkey('ArrowDown'));
check('下键只走一行（第 2 行行首）', vcaret(), 4);
ved.handleKey(vkey('ArrowDown'));
check('再下键到第 3 行', vcaret(), 8);
ved.handleKey(vkey('ArrowUp'));
check('上键退回第 2 行', vcaret(), 4);
ved.handleKey(vkey('ArrowDown', { shift: true }));
await flush();
check('Shift+Down 只扩选一行', vsel.selectedText, 'bbb\n');
ved.handleKey(vkey('Home', { ctrl: true }));
ved.handleKey(vkey('PageDown'));
check('PageDown 落到末行行首', vcaret(), 16);

vlh.set(1.4);
await flush();
ved.handleKey(vkey('Home', { ctrl: true }));
ved.handleKey(vkey('ArrowDown'));
check('行高 1.4 时下键同样只走一行', vcaret(), 4);
vlh.set(1);
await flush();

// 软折行：行距由行盒决定，不能拿光标矩形高度当步长
vt.set('中'.repeat(45));
await flush();
requestFocus(ved);
ved.handleKey(vkey('Home', { ctrl: true }));
for (let i = 0; i < 5; i++) ved.handleKey(vkey('ArrowRight'));
const w0 = vcaret();
ved.handleKey(vkey('ArrowDown'));
const w1 = vcaret();
check('软折行：下键越过当前行', w1 > w0, true);
check('软折行：下键只走一行（未跨到第三行）', w1 < w0 + 35, true);

console.log('— 焦点 / 光标属性是读取式：随信号变化，无需重建节点 —');
const dynShow = createSignal(true);
const dynOrderB = createSignal(2);
const dynCursor = createSignal(null);
const dynCanvas = makeCanvasStub(200, 90);
let dynA = null;
let dynB = null;
let dynC = null;
const dynRect = (extra, setNode) =>
  nodeOf(n => {
    setNode(n);
    return rectNode.create({
      width: () => 120,
      height: () => 30,
      background: () => 0xff334455,
      ...extra,
    });
  });
renderCanvas({
  canvas: dynCanvas,
  layout: flex({ direction: 'y' }),
  children: [
    dynRect(
      { focusable: dynShow.get, focusOrder: () => 1, cursor: dynCursor.get },
      n => (dynA = n)
    ),
    dynRect(
      { focusable: () => true, focusOrder: dynOrderB.get },
      n => (dynB = n)
    ),
    dynRect({ focusable: () => true, focusOrder: () => 3 }, n => (dynC = n)),
  ],
});
await flush();
const tabKey = shift => ({
  key: 'Tab',
  code: 'Tab',
  shiftKey: !!shift,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  preventDefault() {},
});

check(
  'focusable / focusOrder / focusTrap 都以方法形式挂在节点上',
  [typeof dynA.focusable, typeof dynA.focusOrder, typeof dynA.focusTrap].join(
    ','
  ),
  'function,function,function'
);
check('focusOrder 读取当前值', dynB.focusOrder(), 2);
check('focusTrap 默认读取为 false', dynA.focusTrap(), false);

requestFocus(dynC);
dynCanvas.dispatch('keydown', tabKey());
check(
  'focusOrder=2 时顺序 A,B,C：末位 Tab 回绕到 A',
  focusedSignal.get(),
  dynA
);

// 只改信号、不 flush、不重建节点，遍历顺序立即改变
dynOrderB.set(4);
requestFocus(dynC);
dynCanvas.dispatch('keydown', tabKey());
check('focusOrder 改大后顺序变为 A,C,B', focusedSignal.get(), dynB);

dynOrderB.set(2);
dynShow.set(false);
requestFocus(dynC);
dynCanvas.dispatch('keydown', tabKey());
check(
  'focusable 关闭后 A 被遍历跳过（末位 Tab 到 B）',
  focusedSignal.get(),
  dynB
);
check('focusable 读取式反映关闭状态', dynA.focusable(), false);

// cursor 同为读取式：同一节点、无重建，光标随信号立即变化
dynShow.set(true);
dynCursor.set(null);
dynCanvas.dispatch('mousemove', mouseEvent(10, 15));
check('可聚焦节点上光标为 pointer', dynCanvas.style.cursor, 'pointer');
dynCursor.set('crosshair');
dynCanvas.dispatch('mousemove', mouseEvent(10, 15));
check('cursor 信号变化后立即生效', dynCanvas.style.cursor, 'crosshair');
dynCursor.set(null);
dynShow.set(false);
dynCanvas.dispatch('mousemove', mouseEvent(10, 15));
check(
  '不可聚焦且无显式 cursor 时回 default',
  dynCanvas.style.cursor,
  'default'
);

console.log(
  `\n通过 ${passed} 项，失败 ${failed} 项${failed ? '（有失败项）' : '（全部通过）'}`
);
process.exit(failed ? 1 : 0);
