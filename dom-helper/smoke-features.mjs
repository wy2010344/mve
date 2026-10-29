/**
 * 新特性冒烟（node 直跑 dist，无树渲染）：`node smoke-features.mjs`
 *
 * 覆盖「canvasRender2 · 新特性」示例页用到、而待办清单没碰过的能力：
 * - Pop / Toast 登记处（`createPopRegistry`）+ `Timer.postDelayed`（假时钟）
 * - `Placement.resolvePlacement`（首选位 / 翻转 / 贴边 clamp）
 * - `ImageLoader`（同 URL 并发去重、失败不缓存）
 * - `richSegments`（装饰线按值比较、样式段随文本变更对齐）
 * - `LayoutAudit`（无依赖边的树 → 0 条违规，且不抛异常）
 *
 * 这些模块都不依赖 Canvas / DOM，所以不需要 CanvasKit 垫片。
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const LIB = require.resolve('./dist/canvasRender2.mjs');
const {
  createPopRegistry,
  showToast,
  setPostDelayed,
  setRepeatEvery,
  repeatEvery,
  createImageLoader,
  resolvePlacement,
  setRangeIn,
  normalizeIn,
  styleAtIn,
  alignIn,
  emptySegments,
  auditLayoutReport,
} = await import(`file://${LIB.replace(/\\/g, '/')}`);

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
function deep(name, actual, expected) {
  check(name, JSON.stringify(actual), JSON.stringify(expected));
}

// ---------- 1. 假时钟（Timer.setPostDelayed）----------
/** 待触发队列 */
let timers = [];
/** 替换全局延时实现，拿回旧实现用于还原 */
const prevTimer = setPostDelayed((delay, action) => {
  const t = { delay, action, cancelled: false };
  timers.push(t);
  return () => {
    t.cancelled = true;
  };
});
/** 推进 [ms] 毫秒：触发所有到点且未取消的 */
function advance(ms) {
  const due = timers.filter(t => !t.cancelled && t.delay <= ms);
  timers = timers.filter(t => !due.includes(t));
  for (const t of due) t.action();
}

console.log('— Timer.postDelayed（替换实现后全调用点跟随）—');
{
  // 用 registry + showToast 走一遍完整链路
  const registry = createPopRegistry();
  check('初始两个清单都为空', registry.popList().length + registry.toastList().length, 0);
  const close = showToast(registry, { content: () => {}, durationMs: 1000 });
  check('showToast 追加一条', registry.toastList().length, 1);
  check('登记了一次延时', timers.length, 1);
  advance(500);
  check('未到点仍在', registry.toastList().length, 1);
  advance(1000);
  check('到点自动关闭（postDelayed 生效）', registry.toastList().length, 0);
  // 提前关闭句柄：重复调用无副作用
  close();
  close();
  check('重复关闭无副作用', registry.toastList().length, 0);

  // 常驻 toast（durationMs <= 0 不登记延时）
  const before = timers.length;
  const close2 = showToast(registry, { content: () => {}, durationMs: 0 });
  check('durationMs<=0 不登记延时', timers.length, before);
  check('常驻 toast 在清单里', registry.toastList().length, 1);
  advance(100000);
  check('常驻 toast 不会被时间关掉', registry.toastList().length, 1);
  close2();
  check('手动关闭常驻 toast', registry.toastList().length, 0);
}

// ---------- 2. 周期调度（光标闪烁用的 repeatEvery）----------
console.log('— Timer.repeatEvery（周期调度，宿主可替换）—');
{
  const repeats = [];
  const prevRepeat = setRepeatEvery((ms, action) => {
    const r = { ms, action, stopped: false };
    repeats.push(r);
    return () => {
      r.stopped = true;
    };
  });
  let ticks = 0;
  const stop = repeatEvery(530, () => {
    ticks++;
  });
  check('登记了周期', repeats.length, 1);
  check('周期间隔透传', repeats[0].ms, 530);
  repeats[0].action();
  repeats[0].action();
  check('周期动作重复执行', ticks, 2);
  stop();
  check('停止后标记 stopped', repeats[0].stopped, true);
  setRepeatEvery(prevRepeat);
}

// ---------- 3. PopRegistry：增删 / 顺序 / clear ----------
console.log('— PopRegistry（Pop / Toast 两个清单）—');
{
  const registry = createPopRegistry();
  const a = registry.appendPop(() => {});
  const b = registry.appendPop(() => {});
  check('appendPop 顺序', registry.popList()[0] === a && registry.popList()[1] === b, true);
  check('removePop 删除中间之外的一项', registry.removePop(a), true);
  check('removePop 后只剩一项', registry.popList().length, 1);
  check('removePop 已删除项返回 false', registry.removePop(a), false);
  registry.appendToast(() => {});
  registry.clear();
  check('clear 清空两层', registry.popList().length + registry.toastList().length, 0);
}

// ---------- 3. resolvePlacement：首选 / 翻转 / 贴边 ----------
console.log('— Placement.resolvePlacement（纯几何）—');
{
  const anchor = { x: 40, y: 40, width: 120, height: 24 };
  const panel = { width: 180, height: 60 };
  const view = { width: 420, height: 400 };
  // 下方放得下 → 贴锚点下方
  const fit = resolvePlacement('BottomStart', anchor, panel, view, 4);
  check('下方放得下 → y = 锚底 + gap', fit.y, 40 + 24 + 4);
  // 下方放不下 → 翻到上方
  const low = { x: 40, y: 360, width: 120, height: 24 };
  const flip = resolvePlacement('BottomStart', low, panel, view, 4);
  check('下方放不下 → 翻到上方', flip.y, 360 - 60 - 4);
  // 视口未测量（<= 0）→ 只出首选位，不翻转
  const unmeasured = resolvePlacement(
    'BottomStart',
    low,
    panel,
    { width: 0, height: 0 },
    4
  );
  check('视口未测量 → 保持首选位', unmeasured.y, 360 + 24 + 4);
  // 右侧越界 → clamp 贴边
  const right = resolvePlacement(
    'BottomEnd',
    { x: 380, y: 10, width: 40, height: 20 },
    panel,
    view,
    4
  );
  check('右侧越界 → 贴视口右边', right.x, 420 - 180);
}

// ---------- 4. ImageLoader：并发去重 / 失败不缓存 ----------
console.log('— ImageLoader（注入 fetcher，同 URL 去重）—');
{
  let fetchCount = 0;
  /** 挂起的 onBytes（模拟网络未返回） */
  const pending = [];
  const loader = createImageLoader((_url, onBytes) => {
    fetchCount++;
    pending.push(onBytes);
  });

  const got = [];
  loader.load('u://a', img => got.push(img));
  loader.load('u://a', img => got.push(img));
  check('同 URL 并发只取一次字节', fetchCount, 1);
  check('结算前无回调', got.length, 0);
  // 结算为失败（bytes = null）：两个排队回调都要收到
  pending.splice(0).forEach(fn => fn(null));
  await new Promise(r => setTimeout(r, 0));
  check('两个等待回调共享结果', got.length, 2);
  check('失败结果是 null', got[0], null);

  // 失败**不缓存**：再请求要重新取字节
  loader.load('u://a', () => {});
  check('失败不缓存 → 再次取字节', fetchCount, 2);
}

// ---------- 5. richSegments：装饰线按值比较 ----------
console.log('— richSegments（样式段：按值比较 / 对齐）—');
{
  const bold = { fontWeight: 700 };
  const bold2 = { fontWeight: 700 };
  // 两个"同值不同引用"的段必须合并
  deep('同值样式段合并', normalizeIn([
    { end: 3, style: bold },
    { end: 8, style: bold2 },
  ], 8), [{ end: 8, style: bold }]);

  // 装饰线是对象：`{underline:true}` 与另一个同值对象也要合并（此前比引用会漏）
  const under1 = { decoration: { underline: true } };
  const under2 = { decoration: { underline: true } };
  deep('装饰线同值合并', normalizeIn([
    { end: 4, style: under1 },
    { end: 9, style: under2 },
  ], 9), [{ end: 9, style: under1 }]);

  // 装饰线不同值不能合并
  deep('装饰线不同值不合并', normalizeIn([
    { end: 4, style: { decoration: { underline: true } } },
    { end: 9, style: { decoration: { lineThrough: true } } },
  ], 9).length, 2);

  // 末段补基础样式
  deep('末段补 null', normalizeIn([{ end: 4, style: bold }], 10), [
    { end: 4, style: bold },
    { end: 10, style: null },
  ]);

  // setRangeIn：区间外整段保留、相交段裁剪
  const base = normalizeIn([{ end: 10, style: null }], 10);
  deep('setRangeIn 整段设样式', setRangeIn(base, 'abcdefghij', 2, 5, bold), [
    { end: 2, style: null },
    { end: 5, style: bold },
    { end: 10, style: null },
  ]);

  check('styleAtIn 取所在段', styleAtIn(base, 'abcdef', 3), null);

  // alignIn：在中间插入 2 个字符 → 后段样式整体右移，插入区继承左侧样式
  const before = normalizeIn([
    { end: 3, style: null },
    { end: 6, style: bold },
  ], 6);
  deep('alignIn 插入后后段平移', alignIn(before, 'abcdef', 'abcXYdef'), [
    { end: 5, style: null },
    { end: 8, style: bold },
  ]);

  // 空表 + 空文本
  check('空文本 → 空表', normalizeIn([], 0) === emptySegments, true);
}

// ---------- 6. LayoutAudit：无依赖边 → 0 条违规 ----------
console.log('— LayoutAudit（mock 树，只读探测）—');
{
  const mkNode = (name, children = []) => ({
    debugName: () => name,
    children: () => children,
    width: () => 10,
    height: () => 10,
    x: () => 0,
    y: () => 0,
    findExt: () => undefined,
  });
  const leaf = mkNode('leaf');
  const root = mkNode('root', [leaf, mkNode('leaf2')]);
  const report = auditLayoutReport(root);
  check('无依赖边 → 0 条违规', report.length, 0);
  check('报告是数组', Array.isArray(report), true);
  // 审计后探测模式必须复位（不能影响后续测量）
  check('审计后仍可测量', root.width(), 10);
}

// 还原全局延时实现（setPostDelayed 返回旧实现，再传回去即还原）
setPostDelayed(prevTimer);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
