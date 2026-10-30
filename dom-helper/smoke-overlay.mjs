/**
 * 浮层 / 共用能力冒烟测试（node 直跑 dist）：
 *   node smoke-overlay.mjs
 *
 * 覆盖：
 * - `canvasCore/Placement`（八方向 + 翻转 + 贴边 + 未测量视口）
 * - `canvasCore/ImageLoader`（并发去重、无 fetcher 降级、失败不缓存）
 * - `canvasCore/Timer`（postDelayed / 可重置延时 / 假时钟注入）
 * - `Pop` 登记处 + `Toast`（容器点击穿透、定时关闭）
 * - `Popover`（锚定放置 + 点外面关闭）
 * - `tree/layoutAudit`（探测判环，不崩溃）
 *
 * 垫片与 smoke-components.mjs 同体系，但**不初始化 canvaskit-wasm**。
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------- 1. DOM 垫片 ----------

const rafQueue = [];
globalThis.HTMLCanvasElement = class HTMLCanvasElement {};
globalThis.document = {
  createElement() {
    const c = new globalThis.HTMLCanvasElement();
    c.width = 0;
    c.height = 0;
    c.getContext = () => ({ putImageData() {} });
    c.style = {};
    c.remove = () => {};
    return c;
  },
  body: { appendChild() {}, removeChild() {} },
  head: { appendChild() {} },
  addEventListener() {},
  removeEventListener() {},
};
globalThis.window = globalThis;
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
function checkTruthy(name, actual) {
  check(name, Boolean(actual), true);
}

const ctx2d = {
  fillStyle: '',
  strokeStyle: '',
  globalAlpha: 1,
  font: '',
  textBaseline: '',
  lineWidth: 1,
  clearRect() {},
  save() {},
  restore() {},
  fillRect() {},
  strokeRect() {},
  beginPath() {},
  rect() {},
  clip() {},
  closePath() {},
  moveTo() {},
  lineTo() {},
  arc() {},
  arcTo() {},
  fill() {},
  stroke() {},
  drawImage() {},
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

// ---------- 2. 加载 dist 产物 ----------

const {
  auditLayout,
  createImageLoader,
  createPostDelayed,
  defaultSize,
  flex,
  hitPath,
  layoutSize,
  node2,
  nodeOf,
  postDelayed,
  rectNode,
  renderCanvas,
  resolvePlacement,
  setPostDelayed,
  showPopover,
  showToast,
  sizeFromChildren,
} = await import('./dist/canvasRender2.mjs');

// ===========================================================================
console.log('=== 1. Placement：八方向放置（对标 Kotlin helper/Placement.kt） ===');
// ===========================================================================

const V = { width: 400, height: 300 };
const A = { x: 10, y: 20, width: 100, height: 30 };
const P = { width: 80, height: 60 };

function at(placement, anchor = A, panel = P, view = V, gap = 4) {
  const r = resolvePlacement(placement, anchor, panel, view, gap);
  return `${r.x},${r.y}`;
}

check('BottomStart 首选位', at('BottomStart'), '10,54');
check(
  'BottomStart 下方放不下翻到上方',
  at('BottomStart', { x: 10, y: 280, width: 100, height: 30 }),
  '10,216'
);
check(
  'BottomStart 双侧放不下保持首选侧再贴边',
  at('BottomStart', { x: 10, y: 150, width: 100, height: 30 }, { width: 80, height: 200 }),
  '10,100'
);
check('RightEnd 右侧 + 结束边对齐', at('RightEnd'), '114,0');
check(
  'RightStart 右侧放不下翻到左侧',
  at('RightStart', { x: 340, y: 20, width: 50, height: 30 }),
  '256,20'
);
check(
  'TopEnd 上方 + 结束边对齐',
  at('TopEnd', { x: 300, y: 100, width: 60, height: 20 }),
  '280,36'
);
// 未测量视口（<=0）：只出首选位，不翻转也不 clamp
check(
  '未测量视口只出首选位（不翻转不 clamp）',
  at('BottomStart', { x: 10, y: 280, width: 100, height: 30 }, P, { width: 0, height: 0 }),
  '10,314'
);

// ===========================================================================
console.log('=== 2. ImageLoader：并发去重与降级 ===');
// ===========================================================================

{
  const fetched = [];
  const loader = createImageLoader();
  loader.setFetcher((url, onBytes) => {
    fetched.push(url);
    // 模拟异步取字节：本轮不回调，稍后统一结算（失败 → null）
    queueMicrotask(() => onBytes(null));
  });
  let a = 'init';
  let b = 'init';
  loader.load('a.png', img => (a = img));
  loader.load('a.png', img => (b = img));
  check('同 URL 并发只取一次字节', fetched.length, 1);
  await new Promise(r => setTimeout(r, 5));
  check('排队者拿到同一结果(a)', a, null);
  check('排队者拿到同一结果(b)', b, null);
  loader.load('a.png', () => {});
  check('失败不缓存，下次重新取字节', fetched.length, 2);
  await new Promise(r => setTimeout(r, 5));

  const bare = createImageLoader(null);
  let got = 'init';
  const warn = console.warn;
  const warned = [];
  console.warn = msg => warned.push(msg);
  bare.load('x.png', img => (got = img));
  console.warn = warn;
  check('未注入 fetcher 时回调 null（不崩）', got, null);
  checkTruthy('未注入 fetcher 时有告警', warned.length);
}

// ===========================================================================
console.log('=== 3. Timer：postDelayed 与假时钟 ===');
// ===========================================================================

{
  const timers = [];
  const restore = setPostDelayed((ms, fn) => {
    const t = { ms, fn, cancelled: false };
    timers.push(t);
    return () => {
      t.cancelled = true;
    };
  });
  let fired = 0;
  const cancel = postDelayed(1000, () => fired++);
  check('postDelayed 登记一个定时器', timers.length, 1);
  timers[0].fn();
  check('到点执行一次', fired, 1);
  cancel();
  check('取消后标记为已取消', timers[0].cancelled, true);

  const reset = createPostDelayed();
  let count = 0;
  reset.post(500, () => count++);
  reset.post(500, () => count++);
  const alive = timers.filter(t => !t.cancelled);
  check('再次 post 会取消上一次（只留最新）', alive.length, 1);
  reset.cancel();
  check('取消后全部作废', timers.some(t => !t.cancelled), false);
  // 触发的是"最新那一个"（排队时的第一个已被取消，所以只执行一次）
  let fired2 = 0;
  reset.post(500, () => fired2++);
  timers[timers.length - 1].fn();
  check('到点执行最新那一个', fired2, 1);
  // 注意：restore 是"上一个实现"，要用 setPostDelayed 装回去，不是直接调用
  setPostDelayed(restore);
}

// ===========================================================================
console.log('=== 4. Pop / Toast：登记处 + 容器点击穿透 + 定时关闭 ===');
// ===========================================================================

const canvas = makeCanvasStub(400, 300);
let treeCtx = null;
const { node: root, popRegistry } = renderCanvas({
  canvas,
  layout: flex({ directionJustify: 'center', alignFix: true }),
  children: [
    rectNode({
      width: () => 100,
      height: () => 50,
      debugName: () => 'content',
    }),
    ctx => {
      // 只是为了拿到上下文：自身不产生节点
      treeCtx = ctx;
    },
  ],
});
/** 根的实时 children（业务 + 各浮层 + Toast 容器） */
const kids = () => root.children();
await flush();

check('根 children = 业务 + Toast 容器', kids().length, 2);
const toastBox = kids()[1];
check('Toast 容器不参与布局', toastBox.notInLayout(), true);
check('Toast 容器不拦命中', toastBox.acceptHit(10, 10), false);
check('Toast 容器铺满视口宽', toastBox.width(), 400);
check('Toast 容器铺满视口高', toastBox.height(), 300);

const toastHandle = showToast(popRegistry, {
  durationMs: 0, // 不自动关闭
  content: ctx =>
    rectNode({
      width: () => 120,
      height: () => 40,
      debugName: () => 'toast',
    })(ctx),
});
await flush();
const toasts = () => toastBox.children()[0].children();
const toastContent = toasts().find(it => it.debugName() === 'toast');
checkTruthy('toast 已进入渲染树', toastContent);
check('toast 尺寸由内容推导', toastContent.width(), 120);

{
  // 点击落在 toast 之外：容器铺满整个画布，如果它拦命中就拿不到业务节点
  const path = hitPath(root, 155, 130);
  const leaf = path[path.length - 1].node;
  check('toast 之外点击穿透到业务节点', leaf.debugName(), 'content');
}

{
  const timers = [];
  const restore = setPostDelayed((ms, fn) => {
    timers.push({ ms, fn });
    return () => {};
  });
  showToast(popRegistry, {
    durationMs: 2000,
    content: ctx =>
      rectNode({
        width: () => 60,
        height: () => 20,
        debugName: () => 'toast2',
      })(ctx),
  });
  await flush();
  check('默认时长登记一个定时器', timers.length, 1);
  check('登记的是设定的时长', timers[0].ms, 2000);
  timers[0].fn();
  await flush();
  check(
    '到点自动移除',
    toasts().some(it => it.debugName() === 'toast2'),
    false
  );
  setPostDelayed(restore);
  toastHandle();
  await flush();
  check('全部关闭后无残留', toasts().length, 0);
}

// ===========================================================================
console.log('=== 5. Popover：锚定放置 + 点外面关闭 ===');
// ===========================================================================

{
  const anchor = { x: 100, y: 100, width: 80, height: 24 };
  const close = showPopover(treeCtx, {
    anchor: () => anchor,
    placement: () => 'BottomStart',
    gap: () => 6,
    debugName: () => 'panel',
    children: [
      rectNode({
        width: () => 90,
        height: () => 70,
        debugName: () => 'panel-body',
      }),
    ],
  });
  await flush();
  const panel = kids()[1];
  check('浮层面板进了 Pop 层', panel.debugName(), 'panel');
  check('面板不参与布局', panel.notInLayout(), true);
  check('面板宽由内容推导', panel.width(), 90);
  check('面板高由内容推导', panel.height(), 70);
  check('面板 x 与锚点起始边对齐', panel.x(), 100);
  check('面板 y = 锚底 + gap', panel.y(), 130);

  canvas.dispatch('mousedown', { offsetX: 110, offsetY: 140, button: 0 });
  await flush();
  check('点面板内不关闭', kids()[1].debugName(), 'panel');
  canvas.dispatch('mousedown', { offsetX: 120, offsetY: 110, button: 0 });
  await flush();
  check('点锚点不算外面（由业务决定开关）', kids()[1].debugName(), 'panel');
  canvas.dispatch('mousedown', { offsetX: 300, offsetY: 280, button: 0 });
  await flush();
  check('点外面关闭', kids().length, 2);
  close();
  await flush();
  check('重复关闭无副作用', kids().length, 2);
}

// ===========================================================================
console.log('=== 6. LayoutAudit：探测判环（不崩溃） ===');
// ===========================================================================

{
  let bad = false;
  const canvas2 = makeCanvasStub(400, 300);
  const { node: root2 } = renderCanvas({
    canvas: canvas2,
    layout: flex({ directionJustify: 'center', alignFix: true }),
    children: [
      rectNode({
        width: () => 200,
        debugName: () => 'container',
        layout: flex({ direction: 'y' }),
        children: [
          // 坏小子：默认布局是绝对定位（不能由子项推尺寸），尺寸只能问父级要。
          // 父级是 flex，测量时又会读回它 → 成环。
          nodeOf(self =>
            node2({
              nodeRef: self,
              debugName: () => 'bad-child',
              size: d =>
                d === 'y' && bad
                  ? defaultSize(self.get(), d)
                  : layoutSize(40, true),
            })
          ),
        ],
      }),
    ],
  });
  await flush();
  check('好树上没有成环', auditLayout(root2).length, 0);

  bad = true;
  // 真绘制到这里会抛 LayoutCycleError；审计走探测模式，不递归、不抛
  const findings = auditLayout(root2);
  check('坏树上查出 1 处成环', findings.length, 1);
  if (findings.length == 1) {
    const f = findings[0];
    check('违规节点是 bad-child', f.node.debugName(), 'bad-child');
    check('父级是 container', f.parent.debugName(), 'container');
    check('成环发生在纵轴', f.direction, 'y');
    check('环由两条边闭合', f.cycle.length, 2);
    checkTruthy('报告点名了节点', f.report().includes('bad-child'));
    checkTruthy('报告给了修法', f.report().includes('修法（二选一）'));
  }
  bad = false;
  await flush();
  check('改回好尺寸后仍无成环', auditLayout(root2).length, 0);
}

{
  // READ 边的归属回归：`sizeFromChildren`（浮层面板用的那一条）必须把子项尺寸
  // 的读取记到**自己**头上。漏了 withReader 时，面板的子项会被记到「此刻正在
  // 测量的外层祖先」头上 → 成 (祖父, 孙) 边，与 ASK 的 (面板, 子) 配不上
  // → 审计漏报。这里的 container 就是那个"外层祖先"。
  const canvas3 = makeCanvasStub(400, 300);
  let bad = false;
  const { node: root3 } = renderCanvas({
    canvas: canvas3,
    layout: flex({ directionJustify: 'center', alignFix: true }),
    children: [
      rectNode({
        debugName: () => 'container',
        layout: flex({ direction: 'y' }),
        children: [
          // 面板：尺寸一律由自己的子项推导（与 Popover 面板同款写法）
          nodeOf(self =>
            node2({
              nodeRef: self,
              debugName: () => 'panel',
              layout: flex({ direction: 'y' }),
              size: d => sizeFromChildren(self.get(), d),
              children: [
                nodeOf(child =>
                  node2({
                    nodeRef: child,
                    debugName: () => 'bad-grandchild',
                    // 位置自算：这样父级布局**只**在 sizeFromChildren 里被求值
                    // （走默认 position 的话，defaultPosition 那条已包 withReader，
                    // 会顺带把 READ 边补上，掩盖归属错误）
                    position: () => 0,
                    size: d =>
                      d === 'y' && bad
                        ? defaultSize(child.get(), d)
                        : layoutSize(30, true),
                  })
                ),
              ],
            })
          ),
        ],
      }),
    ],
  });
  await flush();
  check('面板子树尺寸正常时 0 违规', auditLayout(root3).length, 0);

  bad = true;
  const f3 = auditLayout(root3);
  check('面板自己的子项成环要查出来', f3.length, 1);
  if (f3.length == 1) {
    check('违规节点是 bad-grandchild', f3[0].node.debugName(), 'bad-grandchild');
    check('父级是 panel 而非祖父 container', f3[0].parent.debugName(), 'panel');
    check('成环发生在纵轴', f3[0].direction, 'y');
  }
  bad = false;
  await flush();
  check('面板子树改回好尺寸后仍 0 违规', auditLayout(root3).length, 0);
}

// ---------- 汇总 ----------

console.log(`\n通过 ${passed} 项，失败 ${failed} 项`);
// wy-helper 的批处理通道（MessageChannel）会一直挂着事件循环，显式退出
process.exit(failed > 0 ? 1 : 0);
