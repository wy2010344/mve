/**
 * 批次 A 集成冒烟测试（node 直跑 dist，真实渲染管线）：
 *   node smoke-integration-batch-a.mjs
 * 覆盖新功能在真实节点树上的端到端行为：
 *   - RichTextSpan.url：命中链接片段经 UrlOpener 打开，未命中走用户回调
 *   - Path2 复选框：圆角命中判定（角外点击不触发、中心点击触发）
 *   - TabRender：段落文本 tab 展开（textLength/textInRange 口径）
 *   - renderCanvas 根 draw 钩子：页面背景先于子节点绘制
 * 垫片体系与 smoke-for-each.mjs 相同（先无 document 初始化
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
const ctx2d = {
  get fillStyle() {
    return currentFill;
  },
  set fillStyle(v) {
    currentFill = v;
    recorded.push(['fillStyle', v]);
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
  quadraticCurveTo() {},
  bezierCurveTo() {},
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

const { loadCanvasKit, registerFont, colorToCSS } = await import(
  './dist/canvasRender.mjs'
);
const {
  Path2,
  absoluteX,
  absoluteY,
  appendRoundedRect,
  flex,
  grow,
  node2,
  openUrl,
  rectNode,
  renderCanvas,
  setUrlOpener,
  wrappedTextNode,
} = await import('./dist/canvasRender2.mjs');

await loadCanvasKit('/canvas-kit/canvaskit.js');
registerFont('Noto Sans SC', readFileSync(FONT_FILE));

// ---------- 5. 渲染树：文本卡（链接 + Tab）+ 复选框卡（Path2 命中） ----------

const LINK_URL = 'https://example.com/doc';
const opened = [];
setUrlOpener(url => opened.push(url));

/** 文本节点用户回调命中计数（非链接点击应触发） */
const textClicks = createSignal(0);
/** 复选框命中计数（角外点击不应触发） */
const boxHits = createSignal(0);

const canvasStub = makeCanvasStub(600, 420);

const { node: root } = renderCanvas({
  canvas: canvasStub,
  // 根 draw 钩子：页面背景（先于子节点绘制）
  draw(ctx2) {
    ctx2.fillStyle = colorToCSS(0xfff8fafc);
    ctx2.fillRect(0, 0, canvasStub.width, canvasStub.height);
  },
  layout: flex({ gap: 10, alignFix: true }),
  children: [
    // 文本卡：grow 文本（含链接片段）+ Tab 文本
    rectNode.of({
      width: () => 300,
      height: () => 60,
      padding: () => 8,
      layout: flex({ direction: 'x', gap: 8, alignItem: 'stretch', alignFix: true }),
      children: [
        wrappedTextNode.of({
          exts: [grow({ argGrow: 1 })],
          spans: () => [
            {
              text: '普通文本',
              style: { fontFamily: 'Noto Sans SC', fontSize: 13 },
            },
            {
              text: '链接点我',
              url: LINK_URL,
              style: {
                fontFamily: 'Noto Sans SC',
                fontSize: 13,
                color: 0xff2563eb,
                decoration: { underline: true },
              },
            },
          ],
          mouseClick() {
            textClicks.set(textClicks.get() + 1);
          },
        }),
        wrappedTextNode.of({
          autoWidth: () => true,
          text: () => 'A\tB',
          fontFamily: () => 'Noto Sans SC',
          fontSize: () => 13,
        }),
      ],
    }),
    // 复选框卡：Path2 圆角命中
    rectNode.of({
      width: () => 300,
      height: () => 40,
      padding: () => 8,
      layout: flex({ direction: 'x' }),
      children: [
        (() => {
          const box = new Path2();
          appendRoundedRect(box, 0.75, 0.75, 16.5, 16.5, 4);
          return node2.of({
            size: () => 18,
            acceptHit(x, y) {
              return box.contains(x, y);
            },
            draw(ctx2) {
              box.applyTo(ctx2);
              ctx2.strokeStyle = colorToCSS(0xff94a3b8);
              ctx2.lineWidth = 1.5;
              ctx2.stroke();
            },
            mouseClick() {
              boxHits.set(boxHits.get() + 1);
            },
          });
        })(),
      ],
    }),
  ],
});
await flush();

const textCard = root.children()[0];
const linkText = textCard.children()[0];
const tabText = textCard.children()[1];
const checkCard = root.children()[1];
const checkBox = checkCard.children()[0];

// ---------- 6. 根 draw 背景 ----------

console.log('1. 根 draw 钩子（页面背景）');
const bgIndex = recorded.findIndex(
  r => r[0] == 'fillRect' && r[1] === 0 && r[2] === 0 && r[3] === 600 && r[4] === 420
);
check('背景 fillRect 覆盖全画布', bgIndex >= 0, true);
check(
  '背景色先于子节点设置',
  bgIndex > 0 && recorded[bgIndex - 1][0] == 'fillStyle' && recorded[bgIndex - 1][1] == 'rgb(248,250,252)',
  true
);

// ---------- 7. Tab 展开（管线口径） ----------

console.log('2. TabRender 段落展开');
check('Tab 文本可参与选择（Selectable2 挂载）', typeof tabText.positionForPoint, 'function');
check('textLength 按展开后口径', tabText.textLength(), 6);
check('textInRange 展开为 4 空格', tabText.textInRange(0, 6), 'A    B');

// ---------- 8. 链接点击 ----------

console.log('3. RichTextSpan.url 链接点击');
const linkOriginX = absoluteX(linkText) + linkText.paddingInlineStart();
const linkOriginY = absoluteY(linkText) + linkText.paddingBlockStart();

function clickAt(x, y) {
  canvasStub.dispatch('mousedown', { offsetX: x, offsetY: y, button: 0, shiftKey: false });
  canvasStub.dispatch('mouseup', { offsetX: x, offsetY: y, button: 0, shiftKey: false });
  canvasStub.dispatch('click', { offsetX: x, offsetY: y, button: 0 });
}

// 普通文本区（offset ≈ 1）：不走链接，走用户回调
clickAt(linkOriginX + 10, linkOriginY + 8);
await flush();
check('普通区点击触发用户 mouseClick', textClicks.get(), 1);
check('普通区点击不开链接', opened.length, 0);

// 链接区（'普通文本' 4 个全角字 ≈ 52px，+70 必落在链接片段内）
clickAt(linkOriginX + 70, linkOriginY + 8);
await flush();
check('链接区点击经 UrlOpener 打开', opened.length, 1);
check('打开的是 span.url', opened[0], LINK_URL);
// Kotlin 语义：super.onPointerClick 先行，用户回调与链接打开都触发
check('链接区点击也走用户 mouseClick（Kotlin: super 先行）', textClicks.get(), 2);

// ---------- 9. Path2 复选框命中 ----------

console.log('4. Path2 圆角命中');
const boxX = absoluteX(checkBox);
const boxY = absoluteY(checkBox);

// 圆角缺口（local 1,1）：路径外 → 不触发
clickAt(boxX + 1, boxY + 1);
await flush();
check('圆角缺口点击不触发', boxHits.get(), 0);

// 中心（local 9,9）：路径内 → 触发
clickAt(boxX + 9, boxY + 9);
await flush();
check('中心点击触发', boxHits.get(), 1);

// 卡片内但复选框外：不触发
clickAt(boxX + 200, boxY + 20);
await flush();
check('复选框外点击不触发', boxHits.get(), 1);

// ---------- 汇总 ----------

console.log(`\n${passed} 通过, ${failed} 失败`);
if (failed > 0) process.exitCode = 1;
