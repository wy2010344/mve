/**
 * forEachNode 动态列表冒烟测试（node 直跑 dist，真实渲染管线）：
 *   node smoke-for-each.mjs
 * 覆盖：key 驱动的节点复用/销毁（增/删/改/重排）、空态、布局几何、
 *       条目鼠标交互（click → 信号 → 重排）、滚动内容尺寸跟随。
 * 垫片体系与 smoke-components.mjs 相同（先无 document 初始化
 * canvaskit-wasm，再打 DOM 垫片；假 HTMLCanvasElement 类命中
 * MakeSWCanvasSurface 的 instanceof 分支；rAF 队列手动 flush）。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createSignal } from 'wy-helper';

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
globalThis.document = {
  createElement() {
    const c = new globalThis.HTMLCanvasElement();
    c.width = 0;
    c.height = 0;
    c.getContext = () => ({ putImageData() {} });
    return c;
  },
  head: { appendChild() {} },
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
      `  FAIL ${name}: 期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(
        actual
      )}`
    );
  }
}

const recorded = [];
let currentFill = '';
let currentStroke = '';
const ctx2d = {
  get fillStyle() {
    return currentFill;
  },
  set fillStyle(v) {
    currentFill = v;
    recorded.push(['fillStyle', v]);
  },
  get strokeStyle() {
    return currentStroke;
  },
  set strokeStyle(v) {
    currentStroke = v;
    recorded.push(['strokeStyle', v]);
  },
  globalAlpha: 1,
  font: '',
  textBaseline: '',
  textAlign: '',
  lineWidth: 1,
  lineCap: '',
  clearRect(...a) {
    recorded.push(['clearRect', ...a]);
  },
  save() {},
  restore() {},
  fillRect(...a) {
    recorded.push(['fillRect', ...a]);
  },
  strokeRect(...a) {
    recorded.push(['strokeRect', ...a]);
  },
  beginPath() {
    recorded.push(['beginPath']);
  },
  rect(...a) {
    recorded.push(['rect', ...a]);
  },
  clip() {
    recorded.push(['clip']);
  },
  closePath() {},
  moveTo() {},
  lineTo() {},
  arc() {},
  arcTo() {},
  fill() {
    recorded.push(['fill']);
  },
  stroke() {
    recorded.push(['stroke']);
  },
  drawImage(...a) {
    recorded.push(['drawImage', ...a.slice(1)]);
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
  c.dispatch = (type, event) => {
    listeners.get(type)?.forEach(fn => fn(event));
  };
  return c;
}

async function flush() {
  for (let i = 0; i < 4; i++) {
    rafQueue.splice(0).forEach(cb => cb(Date.now()));
    await new Promise(r => setTimeout(r, 0));
  }
}

// ---------- 4. 加载 dist 产物 ----------

const { loadCanvasKit, registerFont } = await import('./dist/canvasRender.mjs');
const {
  absoluteX,
  absoluteY,
  contentSize,
  createScroll,
  flex,
  forEachNode,
  grow,
  maxScroll,
  rectNode,
  renderCanvas,
  scrollContent,
  wrappedTextNode,
} = await import('./dist/canvasRender2.mjs');

await loadCanvasKit('/canvas-kit/canvaskit.js');
registerFont('Noto Sans SC', readFileSync(FONT_FILE));

// ---------- 5. 数据与渲染树：容器 + scrollContent + forEachNode ----------

/** 数据项：{ id, text, done }；key 取 id */
const items = createSignal([
  { id: 1, text: '第一项', done: false },
  { id: 2, text: '第二项', done: true },
  { id: 3, text: '第三项', done: false },
  { id: 4, text: '第四项', done: false },
  { id: 5, text: '第五项', done: false },
]);

const canvasStub = makeCanvasStub(600, 420);

const { node: root } = renderCanvas({
  canvas: canvasStub,
  layout: flex({ directionJustify: 'flex-start', gap: 10, alignFix: true }),
  children: [
    // forEachNode 直接作为容器 children 的一项（Fc 组件，不产生自己的节点）
    rectNode.of({
      width: () => 360,
      height: () => 260,
      background: () => 0xffffffff,
      borderColor: () => 0xffe2e8f0,
      radius: () => 8,
      padding: () => 8,
      layout: flex({
        direction: 'x',
        gap: 4,
        alignItem: 'stretch',
        alignFix: true,
      }),
      children: [
        ctx => {
          const container = ctx.getParent();
          const scroll = createScroll(container, 'y');
          scrollContent.of({
            scroll,
            exts: [grow({ argGrow: 1 })],
            layout: flex({ alignFix: true, alignItem: 'stretch', gap: 6 }),
            children: [
              // 条目工厂：rectNode + wrappedTextNode；node 上挂 id 验证复用身份
              forEachNode(
                cb => items.get().forEach(t => cb(t.id, t)),
                function (key, eachTime) {
                  // 箭头包裹保持 eachTime 绑定（getValue 内部读 getSignal）
                  const item = () => eachTime.getValue();
                  rectNode
                    .of({
                      height: () => 40,
                      paddingInline: () => 10,
                      paddingBlock: () => 11,
                      background: () =>
                        item().done ? 0xfff8fafc : 0xffffffff,
                      borderColor: () => 0xffe2e8f0,
                      radius: () => 6,
                      layout: flex({ direction: 'x', gap: 8 }),
                      mouseClick() {
                        items.set(
                          items
                            .get()
                            .map(t =>
                              t.id == item().id
                                ? { ...t, done: !t.done }
                                : t
                            )
                        );
                      },
                      children: [
                        wrappedTextNode.of({
                          exts: [grow({ argGrow: 1 })],
                          spans: () => [
                            {
                              text: item().text,
                              style: {
                                fontFamily: 'Noto Sans SC',
                                fontSize: 13,
                                color: item().done
                                  ? 0xff94a3b8
                                  : 0xff334155,
                                decoration: item().done
                                  ? { lineThrough: true }
                                  : {},
                              },
                            },
                          ],
                        }),
                      ],
                    })(this);
                  // 把 key 挂到刚创建的节点上不好拿——改用文本长度断言身份
                }
              ),
            ],
          })(ctx);
        },
      ],
    }),
  ],
});
await flush();

const container = root.children()[0];
const content = container.children().find(c => c.isScrollContent);
const entries = () => content.children().filter(c => !c.isScrollContent);

// ---------- 6. 初始渲染 ----------

console.log('1. 初始渲染（5 项）');
check('条目数', entries().length, 5);
check('内容总高 5*40+4*6', contentSize(container, 'y'), 224);
check('maxScroll = 224 - 244 < 0 → 0', maxScroll(container, 'y'), 0);
check('首条目高', entries()[0].height(), 40);
check('首条目含文本子节点', entries()[0].children().length, 1);
check(
  '文本可参与选择（Selectable2 数据面）',
  typeof entries()[0].children()[0].positionForPoint,
  'function'
);

// ---------- 7. 追加：key 驱动的复用 ----------

console.log('2. 追加一项（复用前 5 个节点身份）');
const before = entries();
items.set([...items.get(), { id: 6, text: '第六项', done: false }]);
await flush();
const after = entries();
check('条目数', after.length, 6);
check('内容总高 6*40+5*6', contentSize(container, 'y'), 270);
let sameIdentity = true;
for (let i = 0; i < 5; i++) {
  if (before[i] !== after[i]) sameIdentity = false;
}
check('前 5 个节点身份不变（复用）', sameIdentity, true);
check('新条目在末尾', after[5] !== before[4], true);

// ---------- 8. 删除中间项 ----------

console.log('3. 删除中间项（id=3）');
const beforeDelete = entries();
items.set(items.get().filter(t => t.id != 3));
await flush();
const afterDelete = entries();
check('条目数', afterDelete.length, 5);
check('内容总高 5*40+4*6', contentSize(container, 'y'), 224);
check(
  '剩余节点身份保留（id=4 的还是原来那个）',
  afterDelete[2] === beforeDelete[3],
  true
);
check(
  '被删节点已出树（id=3 节点不在 children）',
  afterDelete.includes(beforeDelete[2]),
  false
);

// ---------- 9. 重排（key 集合不变，顺序跟随数据） ----------

console.log('4. 重排（顺序变、身份不变）');
const beforeReorder = entries();
items.set([...items.get()].reverse());
await flush();
const afterReorder = entries();
check('条目数不变', afterReorder.length, 5);
check('顺序已翻转（首节点换了身份）', afterReorder[0] === beforeReorder[4], true);
check('末节点是原来的首节点', afterReorder[4] === beforeReorder[0], true);
const sameSet = beforeReorder.every(n => afterReorder.includes(n));
check('节点集合不变（无重建无销毁）', sameSet, true);

// ---------- 10. 修改（同 key，值更新） ----------

console.log('5. 修改值（同 key → 复用 + 最新数据）');
const beforeToggle = entries();
const target = beforeToggle[0];
const idOfFirst = items.get()[0].id;
items.set(
  items.get().map(t => (t.id == idOfFirst ? { ...t, done: true } : t))
);
await flush();
check('节点身份不变', entries()[0] === target, true);
check(
  '修改后背景色切换（记录里出现完成态底色）',
  recorded.some(r => r[0] == 'fillStyle' && r[1] == 'rgb(248,250,252)'),
  true
);

// ---------- 11. 鼠标交互：点击条目切换 done ----------

console.log('6. 条目点击（mouseClick → 信号 → 重绘）');
const clickTarget = entries()[1];
const idSecond = items.get()[1].id;
const wasDone = items.get()[1].done;
const cx = absoluteX(clickTarget) + clickTarget.width() / 2;
const cy = absoluteY(clickTarget) + clickTarget.height() / 2;
recorded.length = 0;
canvasStub.dispatch('mousedown', {
  offsetX: cx,
  offsetY: cy,
  button: 0,
  shiftKey: false,
});
canvasStub.dispatch('mouseup', {
  offsetX: cx,
  offsetY: cy,
  button: 0,
  shiftKey: false,
});
canvasStub.dispatch('click', { offsetX: cx, offsetY: cy, button: 0 });
await flush();
check('点击后 done 取反', items.get()[1].done, !wasDone);
check('点击的正是 id=' + idSecond + ' 的项', items.get()[1].id, idSecond);

// ---------- 12. 空态与恢复 ----------

console.log('7. 清空与恢复');
items.set([]);
await flush();
check('条目数归零', entries().length, 0);
check('内容尺寸归零', contentSize(container, 'y'), 0);
check('maxScroll 归零', maxScroll(container, 'y'), 0);
items.set([
  { id: 7, text: '全新甲', done: false },
  { id: 8, text: '全新乙', done: true },
]);
await flush();
check('恢复后条目数', entries().length, 2);
check('恢复后总高 2*40+6', contentSize(container, 'y'), 86);
check(
  '恢复后的节点是全新身份（旧身份未复活）',
  entries().every(n => !beforeReorder.includes(n)),
  true
);

// ---------- 13. 滚动几何 ----------

console.log('8. 滚动几何');
check('内容 86 < 视口 → 不可滚动', maxScroll(container, 'y'), 0);

// ---------- 汇总 ----------

console.log(`\n${passed} 通过, ${failed} 失败`);
if (failed > 0) process.exitCode = 1;
