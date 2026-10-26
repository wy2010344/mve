/**
 * 批次 A 冒烟测试（驱动 dist 产物，纯 node 运行，无 canvas 依赖）：
 *   node smoke-batch-a.mjs
 * 覆盖本批迁移的五个引擎模块：
 *   UndoRedo（动作式撤销/重做全矩阵）/ TextDefaults（信号默认色）/
 *   UrlOpener（平台注入）/ TabRender（tab 展开 + 索引映射）/
 *   Geometry（RectF / Path2 录制·回放·偶数规则命中）。
 */
import {
  DeleteTextAction,
  InsertTextAction,
  Path2,
  RectF,
  ReplaceRangeAction,
  ReplaceSelectionAction,
  SPACES_PER_TAB,
  TextState,
  UndoRedo,
  appendRoundedRect,
  displayToLogic,
  expandTabs,
  logicToDisplay,
  openUrl,
  setUrlOpener,
  textDefaults,
  unionRect,
} from './dist/canvasRender2.mjs';
import { rgba } from './dist/canvasRender.mjs';

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

// ---------- 1. UndoRedo：四种动作 + 栈语义 ----------

console.log('1. UndoRedo 文本动作');
{
  const s0 = new TextState('hello world', 0);
  const insert = new InsertTextAction(0, 'ab');
  const s1 = insert.redo(s0);
  check('插入 redo 文本', s1.text, 'abhello world');
  check('插入 redo 光标', s1.cursor, 2);
  const s2 = insert.undo(s1);
  check('插入 undo 还原', s2.text, 'hello world');
  check('插入 undo 光标', s2.cursor, 0);

  const del = new DeleteTextAction(5, ' ', true); // backspace 删光标前
  const d1 = del.redo(new TextState('hello world', 6));
  check('backspace redo', d1.text, 'helloworld');
  check('backspace undo 光标回原位', del.undo(d1).cursor, 5);
  const delF = new DeleteTextAction(5, ' ', false); // delete 删光标处
  const d2 = delF.redo(new TextState('hello world', 5));
  check('delete redo', d2.text, 'helloworld');
  check('delete undo 光标在删除串后', delF.undo(d2).cursor, 6);

  const sel = new ReplaceSelectionAction(0, 'hello', 'hi');
  const r1 = sel.redo(new TextState('hello world', 5));
  check('替换选区 redo', r1.text, 'hi world');
  check('替换选区 undo', sel.undo(r1).text, 'hello world');

  const range = new ReplaceRangeAction(6, 'world', 'there');
  const g1 = range.redo(new TextState('hello world', 6));
  check('区间替换 redo（可不等长）', g1.text, 'hello there');
  check('区间替换 undo', range.undo(g1).text, 'hello world');
}

console.log('2. UndoRedo 栈语义');
{
  const ur = new UndoRedo();
  const base = new TextState('', 0);
  check('初始 canUndo', ur.canUndo(), false);
  check('空栈 undo', ur.undo(base), null);
  check('空栈 redo', ur.redo(base), null);

  ur.push(new InsertTextAction(0, 'a'));
  ur.push(new InsertTextAction(1, 'b'));
  check('两步后 canUndo', ur.canUndo(), true);
  const u1 = ur.undo(new TextState('ab', 2));
  check('undo 一步', u1.text, 'a');
  check('undo 后 canRedo', ur.canRedo(), true);
  const r1 = ur.redo(u1);
  check('redo 回去', r1.text, 'ab');

  ur.push(new InsertTextAction(2, 'c'));
  check('新 push 清空重做栈', ur.canRedo(), false);

  const small = new UndoRedo(2);
  small.push(new InsertTextAction(0, '1'));
  small.push(new InsertTextAction(1, '2'));
  small.push(new InsertTextAction(2, '3'));
  let s = new TextState('123', 3);
  s = small.undo(s);
  check('maxHistory=2 丢弃最旧（剩 2,3）', s.text, '12');
  s = small.undo(s);
  check('再 undo 到栈底', s.text, '1');
  check('栈底再 undo 为 null', small.undo(s), null);

  small.clear();
  check('clear 后 canUndo', small.canUndo(), false);
  check('clear 后 canRedo', small.canRedo(), false);
}

// ---------- 2. TextDefaults ----------

console.log('3. TextDefaults 默认色与 setter');
{
  check('默认正文色 rgba(30,41,59)', textDefaults.text, rgba(30, 41, 59));
  check('默认占位色 rgba(148,163,184)', textDefaults.placeholder, rgba(148, 163, 184));
  textDefaults.text = rgba(226, 232, 240);
  check('setter 回写正文色', textDefaults.text, rgba(226, 232, 240));
  textDefaults.placeholder = rgba(100, 116, 139);
  check('setter 回写占位色', textDefaults.placeholder, rgba(100, 116, 139));
  // 还原，避免影响同进程后续断言
  textDefaults.text = rgba(30, 41, 59);
  textDefaults.placeholder = rgba(148, 163, 184);
}

// ---------- 3. UrlOpener ----------

console.log('4. UrlOpener 平台注入');
{
  openUrl('https://example.com/no-opener'); // 未注册：静默不炸
  check('未注册时静默（不抛错即通过）', true, true);
  const opened = [];
  setUrlOpener(url => opened.push(url));
  openUrl('https://a.example.com');
  openUrl('https://b.example.com');
  check('注册后收到两次打开', opened.length, 2);
  check('打开参数原样传递', opened[1], 'https://b.example.com');
  setUrlOpener(null);
  openUrl('https://c.example.com');
  check('注销后恢复静默', opened.length, 2);
}

// ---------- 4. TabRender ----------

console.log('5. TabRender 展开与索引映射');
{
  check('SPACES_PER_TAB', SPACES_PER_TAB, 4);
  check('单 tab 展开', expandTabs('a\tb'), 'a    b');
  check('连续 tab 展开', expandTabs('\t\t'), '        ');
  check('无 tab 原样', expandTabs('abc'), 'abc');

  const t = 'a\tb\tc';
  check('logicToDisplay 起点', logicToDisplay(t, 0), 0);
  check('logicToDisplay tab 后', logicToDisplay(t, 1), 1);
  check('logicToDisplay 第二个 tab 前', logicToDisplay(t, 3), 6);
  check('logicToDisplay 文末', logicToDisplay(t, 5), 11);
  check('logicToDisplay 负值钳制', logicToDisplay(t, -3), 0);
  check('logicToDisplay 越界钳制', logicToDisplay(t, 99), 11);

  check('displayToLogic 起点', displayToLogic(t, 0), 0);
  check('displayToLogic 展开区间中间吸附', displayToLogic(t, 3), 2);
  check('displayToLogic 首个展开区末', displayToLogic(t, 5), 2);
  check('displayToLogic 越界到文末', displayToLogic(t, 99), 5);

  // 全位置往返一致
  let roundTrip = true;
  for (let logic = 0; logic <= t.length; logic++) {
    if (displayToLogic(t, logicToDisplay(t, logic)) !== logic) {
      roundTrip = false;
    }
  }
  check('logic↔display 全位置往返', roundTrip, true);
}

// ---------- 5. Geometry：RectF ----------

console.log('6. RectF');
{
  const r = new RectF(10, 20, 30, 50);
  check('width', r.width, 20);
  check('height', r.height, 30);
  check('centerX', r.centerX, 20);
  check('centerY', r.centerY, 35);
  check('contains 内部', r.contains(15, 25), true);
  check('contains 边界含', r.contains(10, 50), true);
  check('contains 外部', r.contains(31, 25), false);
  check('intersects 相交', r.intersects(new RectF(25, 45, 40, 60)), true);
  check('intersects 相离', r.intersects(new RectF(100, 100, 110, 110)), false);
  check('intersects 边相邻不算', r.intersects(new RectF(30, 20, 40, 50)), false);
  check('offset', JSON.stringify(r.offset(1, 2)), JSON.stringify(new RectF(11, 22, 31, 52)));
  check('inflate', JSON.stringify(r.inflate(5)), JSON.stringify(new RectF(5, 15, 35, 55)));

  const u = unionRect(new RectF(0, 0, 10, 10), new RectF(5, 5, 20, 8));
  check('unionRect 并集', JSON.stringify(u), JSON.stringify(new RectF(0, 0, 20, 10)));
}

// ---------- 6. Geometry：Path2 ----------

console.log('7. Path2 录制与元信息');
{
  const empty = new Path2();
  check('空路径 isEmpty', empty.isEmpty, true);
  check('空路径 lastX 兜底', empty.lastX, 0);

  const p = new Path2();
  check('仅 moveTo 也算空', p.moveTo(1, 2).isEmpty, true);
  check('moveTo 后 lastX/lastY', JSON.stringify([p.lastX, p.lastY]), JSON.stringify([1, 2]));
  p.lineTo(3, 4).close();
  check('有线段后非空', p.isEmpty, false);
  check('close 不改变 lastPosition', JSON.stringify([p.lastX, p.lastY]), JSON.stringify([3, 4]));

  const q = new Path2().moveTo(0, 0).quadTo(5, 10, 10, 0);
  check('quadTo 后终点', JSON.stringify([q.lastX, q.lastY]), JSON.stringify([10, 0]));
  const c = new Path2().moveTo(0, 0).cubicTo(1, 2, 3, 4, 5, 6);
  check('cubicTo 后终点', JSON.stringify([c.lastX, c.lastY]), JSON.stringify([5, 6]));

  const rec = [];
  const mockCtx = {
    beginPath: () => rec.push(['beginPath']),
    moveTo: (x, y) => rec.push(['moveTo', x, y]),
    lineTo: (x, y) => rec.push(['lineTo', x, y]),
    quadraticCurveTo: (a, b, x, y) => rec.push(['quadraticCurveTo', a, b, x, y]),
    bezierCurveTo: (a, b, c2, d, x, y) => rec.push(['bezierCurveTo', a, b, c2, d, x, y]),
    closePath: () => rec.push(['closePath']),
  };
  new Path2().moveTo(1, 1).lineTo(2, 2).quadTo(3, 3, 4, 4).cubicTo(5, 5, 6, 6, 7, 7).close().applyTo(mockCtx);
  check('applyTo 回放命令数', rec.length, 6);
  check('applyTo 首命令 beginPath', rec[0][0], 'beginPath');
  check('applyTo moveTo', JSON.stringify(rec[1]), JSON.stringify(['moveTo', 1, 1]));
  check('applyTo quadTo → quadraticCurveTo', JSON.stringify(rec[3]), JSON.stringify(['quadraticCurveTo', 3, 3, 4, 4]));
  check('applyTo cubicTo → bezierCurveTo', JSON.stringify(rec[4]), JSON.stringify(['bezierCurveTo', 5, 5, 6, 6, 7, 7]));
  check('applyTo close → closePath', rec[5][0], 'closePath');

  const reset = new Path2().moveTo(1, 1).lineTo(2, 2).reset();
  check('reset 后 commands 清空', reset.commands.length, 0);
  check('reset 后 isEmpty', reset.isEmpty, true);
}

console.log('8. Path2 命中（偶数规则）');
{
  const rect = new Path2();
  appendRoundedRect(rect, 0, 0, 100, 60, 8);
  check('命令数（moveTo + 4×(边+角弧) + close）', rect.commands.length, 10);
  check('矩形中心命中', rect.contains(50, 30), true);
  check('矩形外不命中', rect.contains(150, 30), false);
  check('圆角缺口不命中（曲线扁平化）', rect.contains(1, 1), false);
  check('圆角内侧命中', rect.contains(8, 8), true);

  // 圆：四段三次贝塞尔弧近似（k ≈ 0.5523），半径 50，圆心 (50,50)
  const circle = new Path2();
  const k = 0.5523 * 50;
  circle.moveTo(100, 50);
  circle.cubicTo(100, 50 + k, 50 + k, 100, 50, 100);
  circle.cubicTo(50 - k, 100, 0, 50 + k, 0, 50);
  circle.cubicTo(0, 50 - k, 50 - k, 0, 50, 0);
  circle.cubicTo(50 + k, 0, 100, 50 - k, 100, 50);
  circle.close();
  check('圆心命中', circle.contains(50, 50), true);
  check('圆边缘内命中', circle.contains(50, 5), true);
  check('圆弧段内命中', circle.contains(95, 50), true);
  check('圆外不命中', circle.contains(50, -5), false);
  check('圆外对角不命中', circle.contains(5, 5), false);

  // 甜甜圈：外框与内框同向（顺时针）——偶数规则下内洞算“外部”
  const donut = new Path2();
  appendRoundedRect(donut, 0, 0, 100, 100, 0);
  appendRoundedRect(donut, 30, 30, 40, 40, 0);
  check('环上命中', donut.contains(10, 50), true);
  check('内洞按偶数规则为外部', donut.contains(50, 50), false);

  // 空路径不命中任何点
  check('空路径不命中', new Path2().contains(0, 0), false);
}

// ---------- 汇总 ----------

console.log(`\n${passed} 通过, ${failed} 失败`);
if (failed > 0) process.exitCode = 1;
