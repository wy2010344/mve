/**
 * 新迁移组件冒烟测试（node 直跑 dist，真实渲染管线）：
 *   node smoke-components.mjs
 * 覆盖 rectNode / wrappedTextNode / Scroll（createScroll+
 * scrollContent 裁剪与偏移）/ ScrollBar（滑块几何与拖拽）/ 浮层滚动条。
 * 垫片体系与 smoke-selection-integration.mjs 相同（先无 document 初始化
 * canvaskit-wasm，再打 DOM 垫片；假 HTMLCanvasElement 类命中
 * MakeSWCanvasSurface 的 instanceof 分支；rAF 队列手动 flush）。
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

// ---------- 3. mock 2D context（记录绘制调用，含 clip/stroke） ----------

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
function checkClose(name, actual, expected, eps = 0.01) {
  if (Math.abs(actual - expected) < eps) {
    passed++;
    console.log(`  ok ${name}`);
  } else {
    failed++;
    console.error(
      `  FAIL ${name}: 期望 ~${expected}，实际 ${actual}`
    );
  }
}

const recorded = [];
let currentFill = '';
let currentStroke = '';
const ctx2d = {
  set fillStyle(v) {
    currentFill = v;
    recorded.push(['fillStyle', v]);
  },
  get fillStyle() {
    return currentFill;
  },
  set strokeStyle(v) {
    currentStroke = v;
    recorded.push(['strokeStyle', v]);
  },
  get strokeStyle() {
    return currentStroke;
  },
  globalAlpha: 1,
  font: '',
  textBaseline: '',
  lineWidth: 1,
  clearRect(...a) {
    recorded.push(['clearRect', ...a]);
  },
  save() {
    recorded.push(['save']);
  },
  restore() {
    recorded.push(['restore']);
  },
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
    const e = { preventDefault: () => {}, ...event };
    listeners.get(type)?.forEach(fn => fn(e));
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
  innerSize,
  maxScroll,
  nodeOf,
  rectNode,
  renderCanvas,
  scrollBar,
  overlayScrollBar,
  overlayScrollBarStyle,
  scrollContent,
  isScrollContentNode,
  asSelectable2,
  wrappedTextNode,
} = await import('./dist/canvasRender2.mjs');

await loadCanvasKit('/canvas-kit/canvaskit.js');
registerFont('Noto Sans SC', readFileSync(FONT_FILE));

// ---------- 5. 搭建渲染树：两个滚动容器（传统滚动条 / 浮层滚动条） ----------

const canvasStub = makeCanvasStub(600, 400);

// 静态数据 + forEachNode 驱动（动态增删语义见 smoke-for-each.mjs）
const itemIndexes = Array.from({ length: 24 }, (_, i) => i);

/** 滚动内容（scrollContent + 24 条固定高度条目），两个容器共用 */
function itemsOf(scroll) {
  return scrollContent.of({
    scroll,
    exts: [grow({ argGrow: 1 })],
    // alignFix：cross 尺寸锁定为自身 inner（避免与子项宽度循环推导）；
    // alignItem stretch：条目横向撑满内容区
    layout: flex({ alignFix: true, alignItem: 'stretch', gap: 6 }),
    children: [
      forEachNode(
        cb => itemIndexes.forEach(i => cb(i, i)),
        function (key, eachTime) {
          const i = eachTime.getValue();
          rectNode.of({
            height: () => 34,
            background: () => (i % 2 ? 0xffffffff : 0xffeef2ff),
            radius: () => 4,
            paddingInline: () => 8,
            layout: flex({ direction: 'x' }),
            children: [
              wrappedTextNode.of({
                text: () => `第 ${i + 1} 项`,
                fontFamily: () => 'Noto Sans SC',
                fontSize: () => 13,
                color: () => 0xff334155,
                // 横向撑满条目剩余空间（经条目 flex 主分配）
                exts: [grow({ argGrow: 1 })],
              }),
            ],
          })(this);
        }
      ),
    ],
  });
}

// 测试用观感参数：秒级延时改毫秒、关掉渐变（node 里没有 rAF，直接跳终值）
const testBarStyle = {
  ...overlayScrollBarStyle,
  idleDelayMs: 20,
  fadeInMs: 0,
  fadeOutMs: 0,
};

const { node: root, selectionManager } = renderCanvas({
  canvas: canvasStub,
  layout: flex({ directionJustify: 'center', gap: 10, alignFix: true }),
  children: [
    // 容器一：传统占位式滚动条（吃掉 10px 布局宽度）
    nodeOf(container =>
      rectNode.create({
        width: () => 320,
        height: () => 220,
        background: () => 0xfff1f5f9,
        borderColor: () => 0xffcbd5e1,
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
            // children 是懒构建的，此处在真实绘制期执行。容器节点经 ctx.getParent()
            // 取得（不依赖 ref 是否已 set：ref.set 在节点工厂末尾收尾），
            // 与 demo 里 todo-list 的写法一致。
            const scroll = createScroll(ctx.getParent(), 'y');
            // 滚轮由 scrollContent / scrollBar 沿命中链自己接管，无需任何注册
            itemsOf(scroll)(ctx);
            scrollBar.of({ scroll })(ctx);
          },
        ],
      })
    ),
    // 容器二：macOS 风格浮层滚动条（不占布局宽度 + 自动隐藏）
    nodeOf(container =>
      rectNode.create({
        width: () => 200,
        height: () => 150,
        background: () => 0xfff1f5f9,
        borderColor: () => 0xffcbd5e1,
        radius: () => 8,
        padding: () => 8,
        // 无 gap：浮层滚动条自己不占宽度，内容直接拿满
        layout: flex({ direction: 'x', alignItem: 'stretch', alignFix: true }),
        children: [
          ctx => {
            const scroll = createScroll(ctx.getParent(), 'y');
            itemsOf(scroll)(ctx);
            overlayScrollBar.of({ scroll, style: () => testBarStyle })(ctx);
          },
        ],
      })
    ),
  ],
});
await flush();

// ---------- 6. 定位节点 ----------

const container = root.children()[0];
const content = container.children().find(c => isScrollContentNode(c));
const track = container.children().find(c => c !== content);
const thumb = track.children()[0];
const firstItem = content.children()[0];
const firstText = firstItem.children()[0];

const overlayContainer = root.children()[1];
const overlayContent = overlayContainer
  .children()
  .find(c => isScrollContentNode(c));
const overlayBar = overlayContainer.children().find(c => c !== overlayContent);

console.log('6. 布局与节点发现');
check('容器尺寸', JSON.stringify([container.width(), container.height()]), '[320,220]');
check('发现 scrollContent', Boolean(content), true);
check('发现 scrollBar 轨道', Boolean(track), true);
check('发现滑块', Boolean(thumb), true);
check('内容项数', content.children().length, 24);
check(
  '第一项文本可参与跨组件选择',
  selectionManager.isSelectable(asSelectable2(firstText)),
  true
);

// ---------- 7. 滚动几何 ----------

console.log('7. 滚动几何');
// 24 项 * 34 + 23 间隙 * 6 = 954
check('contentSize(y)', contentSize(container, 'y'), 954);
check('容器 inner 高度', innerSize(container, 'y'), 204);
check('maxScroll(y)', maxScroll(container, 'y'), 750);
check('轨道厚度（cross=10）', track.width(), 10);
check('轨道撑满容器 inner 高度', track.height(), 204);
// 与 Scroll2.scrollBarSize 相同口径：len=v=innerSize, c=contentSize, m=maxScroll
const bar = (() => {
  const len = innerSize(container, 'y');
  const cs = contentSize(container, 'y');
  const m = maxScroll(container, 'y');
  const size = Math.max(20, (len * len) / cs);
  return { size, maxOffset: len - size, maxScroll: m };
})();
checkClose('滑块尺寸', thumb.height(), bar.size);
// 滑块 position 是**相对轨道**的局部坐标。用 defaultPosition(轨道) 会算成
// "轨道在容器里的位置"（x≈298），滑块被推到轨道外——那就是"拖拽条不出现"的原因
check('滑块贴轨道起点（局部 x）', thumb.x(), 0);
checkClose('滑块初始偏移', thumb.y(), 0);
checkClose('滑块最大偏移', bar.maxOffset, 204 - bar.size);
check('内容初始位置（padding - 0）', content.y(), 8);

// ---------- 8. 滚轮滚动 ----------

console.log('8. 滚轮滚动');
const cx = absoluteX(container) + 160;
const cy = absoluteY(container) + 100;
canvasStub.dispatch('wheel', {
  offsetX: cx,
  offsetY: cy,
  deltaX: 0,
  deltaY: 120,
});
check('滚轮后内容上移', content.y(), 8 - 120);
canvasStub.dispatch('wheel', {
  offsetX: cx,
  offsetY: cy,
  deltaX: 0,
  deltaY: 10000,
});
check('滚轮超量被钳制到 maxScroll', content.y(), 8 - 750);
// 滚轮落在容器外：不消费
canvasStub.dispatch('wheel', {
  offsetX: cx,
  offsetY: absoluteY(container) - 50,
  deltaX: 0,
  deltaY: -10000,
});
check('容器外滚轮不滚动', content.y(), 8 - 750);

// ---------- 9. 滑块拖拽 ----------

console.log('9. 滑块拖拽');
// 先把滚动值复位到 0（上一节滚到了底部）
canvasStub.dispatch('wheel', { offsetX: cx, offsetY: cy, deltaX: 0, deltaY: -100000 });
check('复位后内容位置', content.y(), 8);
const thumbCy = absoluteY(thumb) + thumb.height() / 2;
const thumbCx = absoluteX(thumb) + thumb.width() / 2;
canvasStub.dispatch('mousedown', {
  offsetX: thumbCx,
  offsetY: thumbCy,
  button: 0,
  shiftKey: false,
});
canvasStub.dispatch('mousemove', {
  offsetX: thumbCx,
  offsetY: thumbCy + 50,
  button: 0,
  shiftKey: false,
});
// moveToScroll(50) = 50 * 750 / maxOffset
checkClose('拖拽后内容偏移', content.y(), 8 - (50 * 750) / bar.maxOffset);
canvasStub.dispatch('mouseup', {
  offsetX: thumbCx,
  offsetY: thumbCy + 50,
  button: 0,
  shiftKey: false,
});
const afterUp = content.y();
canvasStub.dispatch('mousemove', {
  offsetX: thumbCx,
  offsetY: thumbCy + 100,
  button: 0,
  shiftKey: false,
});
check('松手后拖拽结束（移动不再滚动）', content.y(), afterUp);

// ---------- 10. 绘制断言：背景/边框/圆角/裁剪 ----------

console.log('10. 绘制断言');
recorded.length = 0;
canvasStub.dispatch('wheel', {
  offsetX: cx,
  offsetY: cy,
  deltaX: 0,
  deltaY: -100000,
});
await flush();
check('容器背景色填充', recorded.some(r => r[0] == 'fillStyle' && r[1] == 'rgb(241,245,249)'), true);
check('容器边框色描边', recorded.some(r => r[0] == 'strokeStyle' && r[1] == 'rgb(203,213,225)'), true);
check('圆角路径已构建（beginPath+fill）', recorded.some(r => r[0] == 'beginPath') && recorded.some(r => r[0] == 'fill'), true);
check('滚动内容绘制时发生裁剪', recorded.filter(r => r[0] == 'clip').length > 0, true);
check('文本经 drawImage 栅格化绘制', recorded.some(r => r[0] == 'drawImage'), true);

// ---------- 11. wrappedTextNode 尺寸推导 ----------

console.log('11. wrappedTextNode');
check('定宽项高度由内容推导（13*1.4≈18.2）', firstText.height() > 15 && firstText.height() < 22, true);
const firstTextSel = asSelectable2(firstText);
check('文本长度', firstTextSel.textLength(), '第 1 项'.length);
check('positionForPoint 单调', firstTextSel.positionForPoint(absoluteX(firstText) + 100, absoluteY(firstText) + 5) >= 0, true);

// ---------- 12. 浮层滚动条（macOS 风格：不占布局 + 自动隐藏） ----------

console.log('12. 浮层滚动条');
const ox = absoluteX(overlayContainer);
const oy = absoluteY(overlayContainer);
/** 本次重绘里是否画了浮层滑块（默认色 rgba(15,23,42,…)） */
const drewThumb = () =>
  recorded.some(
    r => r[0] == 'fillStyle' && String(r[1]).startsWith('rgba(15,23,42')
  );
/** 借容器一的一次微小滚动触发整帧重绘（它自己不改浮层状态） */
function requestRedraw() {
  canvasStub.dispatch('wheel', {
    offsetX: cx,
    offsetY: cy,
    deltaX: 0,
    deltaY: 1,
  });
}

// 不占布局空间：两轴尺寸都是 0，内容拿满容器 inner 宽度（200-16=184）
check('浮层不占宽度', overlayBar.width(), 0);
check('浮层不占高度', overlayBar.height(), 0);
check('内容拿满容器 inner 宽', overlayContent.width(), 184);
// 贴容器内容盒右缘：padding(8) + inner(184) - hitWidth(12)
check('浮层贴右缘', overlayBar.x(), 180);
check('浮层对齐内容顶部', overlayBar.y(), 8);
check('几何可用（容器可滚动）', maxScroll(overlayContainer, 'y'), 820);

// 静止时不绘制（自动隐藏）
requestRedraw();
recorded.length = 0;
await flush();
check('静止时隐藏', drewThumb(), false);

// 滚动 → 浮现
canvasStub.dispatch('wheel', {
  offsetX: ox + 60,
  offsetY: oy + 60,
  deltaX: 0,
  deltaY: 100,
});
recorded.length = 0;
await flush();
check('滚动后浮现', drewThumb(), true);
check('滚动生效', overlayContent.y(), 8 - 100);

// 停手 idleDelayMs（测试里 20ms）后自动隐藏
await new Promise(resolve => setTimeout(resolve, 60));
requestRedraw();
recorded.length = 0;
await flush();
check('停手后自动隐藏', drewThumb(), false);

// 指针移到贴边感应带 → 不滚动也能唤出来（悬停态）
canvasStub.dispatch('mousemove', {
  offsetX: ox + 186,
  offsetY: oy + 40,
  button: 0,
  shiftKey: false,
});
recorded.length = 0;
await flush();
check('悬停感应带浮现', drewThumb(), true);
// 移出感应带 → 开始淡出计时
canvasStub.dispatch('mousemove', {
  offsetX: ox + 60,
  offsetY: oy + 40,
  button: 0,
  shiftKey: false,
});
await new Promise(resolve => setTimeout(resolve, 60));
requestRedraw();
recorded.length = 0;
await flush();
check('移出感应带后隐藏', drewThumb(), false);

// ---------- 汇总 ----------

console.log(`\n${passed} 通过, ${failed} 失败`);
process.exit(failed > 0 ? 1 : 0);
