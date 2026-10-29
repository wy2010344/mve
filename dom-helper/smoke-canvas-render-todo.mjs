/**
 * canvas-render-todo demo 的布局冒烟（node 直跑 dist + 真实 CanvasKit）：
 *   node --experimental-strip-types smoke-canvas-render-todo.mjs
 *
 * 目的：在没有浏览器的环境里验证 demo 节点树能构建、布局不抛错、
 * 关键尺寸符合预期、动态数据变化后重绘不炸。
 * 垫片体系与 smoke-components.mjs 相同（先无 document 初始化 canvaskit-wasm，
 * 再打 DOM 垫片；假 HTMLCanvasElement 命中 MakeSWCanvasSurface 的 instanceof 分支）。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { register } from 'node:module';

// demo 的 .ts 之间是 vite 风格的无扩展名相对导入（'./todo-item'），
// node 的 ESM 解析器要求完整路径 —— 自登记解析钩子补 .ts / /index.ts 后缀，
// 这样 `node --experimental-strip-types smoke-canvas-render-todo.mjs` 直接可跑
register(
  new URL('./smoke-ts-resolve.mjs', import.meta.url).href,
  import.meta.url
);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WASM_DIR = path.join(HERE, 'node_modules/canvaskit-wasm/bin');
const FONT_FILE = path.resolve(
  HERE,
  '../../../apps/mve-vite-demo/public/fonts/noto-sans-sc-chinese-simplified-400-normal.woff2'
);
const DEMO = path.resolve(
  HERE,
  '../../../apps/mve-vite-demo/src/pages/canvas-render-todo'
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
globalThis.document = {
  createElement() {
    const c = new globalThis.HTMLCanvasElement();
    c.width = 0;
    c.height = 0;
    c.style = {};
    c.getContext = () => ({ putImageData() {} });
    c.setAttribute = () => {};
    return c;
  },
  head: { appendChild() {} },
  body: { appendChild() {}, removeChild() {} },
  addEventListener() {},
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

// ---------- 3. mock 2D context（记录绘制调用） ----------

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
function checkTrue(name, actual) {
  check(name, Boolean(actual), true);
}

const drawn = {
  fillRect: 0,
  strokeRect: 0,
  drawImage: 0,
  fillText: 0,
  clip: 0,
};
const ctx2d = {
  fillStyle: '',
  strokeStyle: '',
  globalAlpha: 1,
  font: '',
  textBaseline: '',
  textAlign: '',
  lineWidth: 1,
  lineCap: 'butt',
  clearRect() {},
  save() {},
  restore() {},
  fillRect() {
    drawn.fillRect++;
  },
  strokeRect() {
    drawn.strokeRect++;
  },
  fillText() {
    drawn.fillText++;
  },
  beginPath() {},
  rect() {},
  clip() {
    drawn.clip++;
  },
  closePath() {},
  moveTo() {},
  lineTo() {},
  arc() {},
  arcTo() {},
  fill() {},
  stroke() {},
  drawImage() {
    drawn.drawImage++;
  },
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
  return c;
}

async function flush() {
  for (let i = 0; i < 4; i++) {
    rafQueue.splice(0).forEach(cb => cb(Date.now()));
    await new Promise(r => setTimeout(r, 0));
  }
}

// ---------- 4. 加载引擎与 demo 模块 ----------

const {
  loadCanvasKit,
  registerFont,
  renderCanvas,
  flex,
  contentSize,
  maxScroll,
  ScrollContent,
  absolutePosition,
} = await import('./dist/canvasRender.mjs');

await loadCanvasKit('/canvas-kit/canvaskit.js');
registerFont('Noto Sans SC', readFileSync(FONT_FILE));

const store = await import(`file://${DEMO}/todo-store.ts`);
const { renderTodoList } = await import(`file://${DEMO}/todo-list.ts`);
const { renderTodoHeader, renderFilterBar, renderActionBar, renderToolBar } =
  await import(`file://${DEMO}/todo-toolbar.ts`);
const { renderEditorPanel, draftText, submitDraft } = await import(
  `file://${DEMO}/todo-editor.ts`
);

// ---------- 5. 按 view.ts 的根结构搭树 ----------

console.log('\n— 构建节点树（与 view.ts 的根结构一致） —');
const canvasStub = makeCanvasStub(600, 1000);
// 旧版 renderCanvas 要求已在某个 StateHolder 内（浏览器里由 mve 组件的渲染上下文提供），
// node 环境下用 renderRoot 手工建一个根 holder 包住它。
const { renderRoot } = await import('mve-core');
let render;
renderRoot(
  { children: () => [] },
  { after() {}, purifyList: list => list },
  function () {
    render = renderCanvas(canvasStub, {
      layout: flex({ gap: 12, alignFix: true, directionJustify: 'center' }),
      children() {
        renderTodoHeader();
        renderFilterBar();
        renderTodoList();
        renderActionBar();
        renderToolBar();
        renderEditorPanel();
      },
    });
  }
);
checkTrue('renderCanvas 构建成功', render);
check(
  '根子节点数（header/filter/list/action/tool/editor）',
  render.children().length,
  6
);

// ---------- 6. 布局尺寸 ----------

console.log('\n— 布局尺寸 —');
const kids = render.children();
const header = kids[0];
const listBox = kids[2];
check('标题行宽 380', header.outerWidth(), 380);
checkTrue('标题行高按内容推导（>= 20）', header.outerHeight() >= 20);
check('列表容器宽 380', listBox.outerWidth(), 380);
check('列表容器高 340', listBox.outerHeight(), 340);
checkTrue(
  '列表容器在画布内水平居中（x = 110）',
  Math.abs(listBox.x() - 110) < 0.5
);

// 滚动内容：12 条 * (40 + gap 6) - gap = 546
let scrollContentNode = null;
function findScrollContent(node) {
  for (const c of node.children()) {
    if (c instanceof ScrollContent) return c;
    const found = findScrollContent(c);
    if (found) return found;
  }
  return null;
}
scrollContentNode = findScrollContent(listBox);
checkTrue(
  '列表内存在 ScrollContent（滚动裁剪走 drawAtParent）',
  scrollContentNode
);
if (scrollContentNode) {
  check('滚动内容高 = 12*40 + 11*6', contentSize.call(listBox, 'y'), 546);
  checkTrue('可滚动距离 > 0', maxScroll.call(listBox, 'y') > 0);
  check(
    '有条目时子节点数（12 条，空态不渲染）',
    scrollContentNode.children().length,
    12
  );
}

// ---------- 7. 绘制 ----------

console.log('\n— 绘制 —');
drawn.fillRect = 0;
drawn.drawImage = 0;
drawn.clip = 0;
// Renderer 内部 catch 了节点异常只打 console.error，这里收集起来当作失败
const renderErrors = [];
const origError = console.error;
console.error = (...args) => renderErrors.push(args.join(' '));
let drawError = null;
try {
  render.render(ctx2d);
} catch (e) {
  drawError = e;
}
console.error = origError;
check('render 不抛错', drawError && drawError.message, null);
check('渲染过程无内部错误', renderErrors.length, 0);
if (renderErrors.length)
  renderErrors.slice(0, 2).forEach(t => origError('   ' + t.split('\n')[0]));
checkTrue('画了文本段落（drawImage）', drawn.drawImage > 0);
checkTrue('滚动区发生了裁剪（clip）', drawn.clip > 0);

// ---------- 8. 数据变化后重绘 ----------

console.log('\n— 交互与重绘 —');
const before = store.todos.get();
const firstTodo = before[0];
store.toggleTodo(firstTodo.id);
const afterToggle = store.todos.get().find(t => t.id == firstTodo.id);
check('toggleTodo 翻转完成态', afterToggle.done, !firstTodo.done);

store.removeTodo(firstTodo.id);
check('removeTodo 移除一条', store.todos.get().length, before.length - 1);

store.undoTodo();
check('undoTodo 恢复被删条目', store.todos.get().length, before.length);
store.redoTodo();
check('redoTodo 再次删除', store.todos.get().length, before.length - 1);
store.undoTodo();

drawError = null;
try {
  render.render(ctx2d);
} catch (e) {
  drawError = e;
}
check('数据变更后重绘不抛错', drawError && drawError.message, null);

// 过滤切换：全部标记完成 → 「未完成」过滤下无可见待办。
// demo 的空态用 renderIf：空数据时整个滚动区（Scroll/ScrollBar/ScrollContent）
// 都不渲染，容器里只剩一条提示文本，因此要重新查找节点。
store.todos.set(store.todos.get().map(t => ({ ...t, done: true })));
store.filter.set('active');
check('active 过滤下无可见待办', store.visibleTodos().length, 0);
check('无可见待办时不再有 ScrollContent', findScrollContent(listBox), null);
check('无可见待办时容器只剩空态提示', listBox.children().length, 1);
store.filter.set('all');
scrollContentNode = findScrollContent(listBox);
checkTrue('恢复 all 过滤后 ScrollContent 回来', scrollContentNode);
check('恢复 all 过滤后条目回来', scrollContentNode.children().length > 0, true);

// 命中测试 → 点击派发：点第一个条目的复选框应翻转完成态
const firstItem = scrollContentNode.children()[0];
const checkBox = firstItem.children()[0];
const beforeClick = store.todos.get()[0].done;
render.dispatchClick(
  absolutePosition.call(checkBox, 'x') + 9,
  absolutePosition.call(checkBox, 'y') + 9
);
check('点击复选框翻转完成态', store.todos.get()[0].done, !beforeClick);

// ---------- 9. 编辑器 ----------

console.log('\n— 编辑器 —');
const editorPanel = render.children()[5];
function collectFocusable(node, out) {
  if (node.focusable()) out.push(node);
  for (const c of node.children()) collectFocusable(c, out);
  return out;
}
const focusables = collectFocusable(editorPanel, []);
check('面板内可聚焦字段数（草稿 + 备注）', focusables.length, 2);
check('草稿字段 focusOrder', focusables[0].focusOrder(), 1);
check('草稿字段宽 360', focusables[0].outerWidth(), 360);
check('草稿字段高 32（单行）', focusables[0].outerHeight(), 32);
check('备注字段高 72（三行）', focusables[1].outerHeight(), 72);

// 键盘输入走引擎路由：聚焦草稿 → 输入字符 → 受控信号回写
focusables[0].requestFocus();
render.keyPress('a', 'Unknown', false, false, false, false);
await flush();
check('键入 a 写入草稿信号', draftText.get(), 'a');

draftText.set('写周报');
const beforeAdd = store.todos.get().length;
submitDraft();
check('submitDraft 加入列表', store.todos.get().length, beforeAdd + 1);
check('submitDraft 清空草稿', draftText.get(), '');

// ---------- 汇总 ----------

console.log(
  `\n通过 ${passed} 项，失败 ${failed} 项${failed ? '（有失败项）' : '（全部通过）'}`
);
process.exitCode = failed ? 1 : 0;
process.exit(failed ? 1 : 0);
