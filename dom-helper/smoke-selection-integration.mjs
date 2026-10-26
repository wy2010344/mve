/**
 * 跨组件选择集成冒烟测试（node 直跑 dist，驱动真实 renderCanvas + CanvasKit 段落）：
 *   node smoke-selection-integration.mjs
 * 与 smoke-selection.mjs 的分工：那个测 SelectionManager 纯派生逻辑（mock 节点），
 * 这个测真实渲染管线——布局 / 命中测试 / 指针事件 / 高亮绘制 / 选区文本聚合全链路。
 *
 * node 环境垫片要点：
 * - canvaskit-wasm 的 emscripten 工厂在“无 document”时走 node 路径，必须先于 DOM 垫片初始化；
 * - MakeSWCanvasSurface 只认 HTMLCanvasElement / OffscreenCanvas 实例，用假类 + 宽高桩对象；
 * - drawParagraph 内部 document.createElement('canvas') 由垫片提供；
 * - requestAnimationFrame 用队列垫片，测试里手动 flush。
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
// SW surface 的 flush 走 readPixels → new ImageData → putImageData 回填
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
// loadCanvasKit 会找 window.CanvasKitInit；直接回已初始化实例，避免二次跑工厂（会走 web 路径）
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

const recorded = [];
let currentFill = '';
const ctx2d = {
  set fillStyle(v) {
    currentFill = v;
    recorded.push(['fillStyle', v]);
  },
  get fillStyle() {
    return currentFill;
  },
  globalAlpha: 1,
  font: '',
  textBaseline: '',
  clearRect(...a) {
    recorded.push(['clearRect', ...a]);
  },
  save() {},
  restore() {},
  fillRect(...a) {
    recorded.push(['fillRect', ...a]);
  },
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
  for (let i = 0; i < 4; i++) {
    rafQueue.splice(0).forEach(cb => cb(Date.now()));
    await new Promise(r => setTimeout(r, 0));
  }
}

// ---------- 4. 加载 dist 产物 ----------

const { loadCanvasKit, registerFont, colorToCSS, rgba } = await import(
  './dist/canvasRender.mjs'
);
const { renderCanvas, richTextNode, flex, nodeOf, node2, absoluteX, absoluteY } =
  await import('./dist/canvasRender2.mjs');

await loadCanvasKit('/canvas-kit/canvaskit.js');
registerFont('Noto Sans SC', readFileSync(FONT_FILE));

// ---------- 5. 搭建真实渲染树 ----------

const SEL_CSS = colorToCSS(rgba(100, 100, 200, 60));
const canvasStub = makeCanvasStub(400, 600);

const { node: root, selectionManager } = renderCanvas({
  canvas: canvasStub,
  layout: flex({ directionJustify: 'flex-start', gap: 10 }),
  children: [
    // 顶部 4px 分隔条：不可选，用于“空白按下清除”
    nodeOf(node =>
      node2.create({
        width: () => 400,
        height: () => 4,
        draw(ctx) {
          ctx.fillStyle = '#dddddd';
          ctx.fillRect(0, 0, 400, 4);
        },
      })
    ),
    nodeOf(node =>
      richTextNode.create({
        width: () => 380,
        padding: () => 8,
        spans: () => [
          {
            text: 'Hello world',
            style: {
              fontSize: 16,
              color: 0xff333333,
              fontFamily: 'Noto Sans SC',
            },
          },
        ],
      })
    ),
    nodeOf(node =>
      richTextNode.create({
        width: () => 380,
        padding: () => 8,
        spans: () => [
          {
            text: 'Second text',
            style: {
              fontSize: 16,
              color: 0xff333333,
              fontFamily: 'Noto Sans SC',
            },
          },
        ],
      })
    ),
  ],
});
await flush();

const children = root.children();
const bar = children[0];
const A = children[1];
const B = children[2];
check('发现两个富文本可选节点', typeof A.positionForPoint, 'function');
check('A 文本', A.textInRange(0, A.textLength()), 'Hello world');
check('B 文本', B.textInRange(0, B.textLength()), 'Second text');

/** positionForPoint 单调不减：从左缘逐像素找到第一个给出目标偏移的 x */
function xFor(node, offset, y) {
  const left = absoluteX(node);
  const right = left + node.width();
  for (let x = left; x <= right; x++) {
    if (node.positionForPoint(x, y) >= offset) return x;
  }
  return right;
}
const midY = node => absoluteY(node) + node.paddingBlockStart() + 6;

const ay = midY(A);
const by = midY(B);
const ax2 = xFor(A, 2, ay);
const ax8 = xFor(A, 8, ay);
const bx3 = xFor(B, 3, by);
const bx5 = xFor(B, 5, by);

// 模拟 view.ts 的上报路径
let reported = null;
canvasStub.addEventListener('mouseup', () => {
  reported = selectionManager.selectedText ?? '';
});

function mouse(type, x, y, shiftKey = false) {
  canvasStub.dispatch(type, { offsetX: x, offsetY: y, button: 0, shiftKey });
}

// ---------- 6. 初始态 ----------

console.log('6. 初始态');
check('初始无选区', selectionManager.selectedText, null);

// ---------- 7. 跨组件拖选 A(2) → B(3) ----------

console.log('7. 跨组件拖选（真实渲染管线）');
mouse('mousedown', ax2, ay);
mouse('mousemove', bx3, by);
check('按住中实时 selectedText', selectionManager.selectedText, 'llo worldSec');
await flush();
check('高亮 fillStyle 使用选区色', recorded.some(r => r[0] == 'fillStyle' && r[1] == SEL_CSS), true);
const highlight = recorded.findIndex(
  (r, i) =>
    r[0] == 'fillStyle' &&
    r[1] == SEL_CSS &&
    recorded[i + 1]?.[0] == 'fillRect' &&
    recorded[i + 1][3] > 0 &&
    recorded[i + 1][4] > 0
);
check('高亮 fillRect 已绘制', highlight >= 0, true);
check(
  '高亮落在 A 节点局部坐标内',
  recorded[highlight + 1][1] >= 0 && recorded[highlight + 1][1] < A.width(),
  true
);

mouse('mouseup', bx3, by);
check('松手定格 selectedText', selectionManager.selectedText, 'llo worldSec');
check('mouseup 上报选区文本', reported, 'llo worldSec');
check('rangeOf(A)', JSON.stringify(selectionManager.rangeOf(A)), '[2,11]');
check('rangeOf(B)', JSON.stringify(selectionManager.rangeOf(B)), '[0,3]');

// 定格后 hover 不影响
mouse('mousemove', ax8, ay);
check('hover 不影响定格选区', selectionManager.selectedText, 'llo worldSec');

// ---------- 8. 空白按下清除 ----------

console.log('8. 空白按下清除');
mouse('mousedown', 5, absoluteY(bar) + 2);
mouse('mouseup', 5, absoluteY(bar) + 2);
check('点分隔条后清除', selectionManager.selectedText, null);

// ---------- 9. 双击选词 + 词拖扩展 ----------

console.log('9. 双击选词与词拖');
mouse('mousedown', ax8, ay);
mouse('mouseup', ax8, ay);
mouse('mousedown', ax8, ay); // 同点连击 → count=2
check('双击选中整词', selectionManager.selectedText, 'world');
mouse('mousemove', ax2, ay); // 词拖：锚词 world[6,11) 向左扩展到 Hello[0,5)
check('词拖向左扩展', selectionManager.selectedText, 'Hello world');
mouse('mouseup', ax2, ay);

// ---------- 10. 三击选段 ----------

console.log('10. 三击选段');
mouse('mousedown', ax8, ay); // 同点第三次 → count=3
check('三击选中整段', selectionManager.selectedText, 'Hello world');
mouse('mouseup', ax8, ay);

// ---------- 11. Shift 锚点继承 ----------

console.log('11. Shift 锚点继承');
mouse('mousedown', ax2, ay);
mouse('mouseup', ax2, ay); // 定格在 A(2)，塌缩无选区
check('锚点会话已建立', selectionManager.selectedText, null);
mouse('mousedown', bx3, by, true); // Shift+按在 B：复用上一会话 press=A(2)
mouse('mousemove', bx5, by);
mouse('mouseup', bx5, by);
check('Shift 继承锚点后 selectedText', selectionManager.selectedText, 'llo worldSecon');

// ---------- 12. 跨节点反向 ----------

console.log('12. 反向拖选 B(5) → A(2)');
mouse('mousedown', bx5, by);
mouse('mousemove', ax2, ay);
mouse('mouseup', ax2, ay);
check('反向拖选 selectedText', selectionManager.selectedText, 'llo worldSecon');

// ---------- 汇总 ----------

console.log(`\n${passed} 通过, ${failed} 失败`);
process.exit(failed > 0 ? 1 : 0);
