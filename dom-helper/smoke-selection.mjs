/**
 * SelectionManager2 跨组件选择冒烟测试（驱动 dist 产物，纯 node 运行）：
 *   node smoke-selection.mjs
 * 覆盖：可选集合派生 / 五级优先级 / 跨节点范围分配 / 聚合文本 / 程序化指令 /
 *       过期链节点跳过 / 词与段落数据面 / expandWordSelection 纯函数。
 * 约定：mock 可选节点的 positionForPoint 直接把 x 当作文本偏移。
 */
import { createSignal } from 'wy-helper';
import {
  createSelectionManager,
  SelectableExt,
  asSelectable2,
  expandWordSelection,
} from './dist/canvasRender2.mjs';

let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  const ok = Object.is(actual, expected);
  if (ok) {
    passed++;
    console.log(`  ok ${name}`);
  } else {
    failed++;
    console.error(
      `  FAIL ${name}: 期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`
    );
  }
}

// ---------- mock 节点 ----------

function wordRangeAtIn(text, offset) {
  if (offset < 0 || offset > text.length) return null;
  let s = offset;
  let e = offset;
  while (s > 0 && /\S/.test(text[s - 1])) s--;
  while (e < text.length && /\S/.test(text[e])) e++;
  return s === e ? null : [s, e];
}

function paragraphRangeIn(text, offset) {
  const s = text.lastIndexOf('\n', offset - 1) + 1;
  const e = text.indexOf('\n', offset);
  return [s, e < 0 ? text.length : e];
}

function makeTextNode(text) {
  // 扩展只经 findExt 一个消息对外（exts 是闭包里的隐藏集合，与真实节点同构）
  const exts = [];
  const node = {
    children: () => [],
    selectionEnabled: () => true,
    selectionRect: () => ({
      left: 0,
      top: 0,
      right: text.length * 8,
      bottom: 20,
    }),
    textLength: () => text.length,
    // 约定：x 即偏移
    positionForPoint: x => Math.round(x),
    textInRange: (s, e) => text.slice(s, e),
    wordRangeAt: offset => wordRangeAtIn(text, offset),
    paragraphRangeAt: offset => paragraphRangeIn(text, offset),
    findExt: cls => exts.find(it => it instanceof cls),
  };
  // 可选能力经 exts 声明（与真实 RichTextNode 一致），impl 即节点自身
  exts.push(new SelectableExt(node));
  return node;
}

/** 不携带扩展的节点：findExt 一律答 undefined（节点只回答这一个消息） */
function makePlainNode(fields) {
  return { findExt: () => undefined, ...fields };
}

const A = makeTextNode('Hello world'); // 11
const B = makeTextNode('Second text'); // 11
const C = makeTextNode('first\nsecond\nthird'); // 19
const plain = makePlainNode({
  children: () => [],
  selectionEnabled: () => true,
}); // 无可选方法
const hidden = makeTextNode('HIDDEN');
const hiddenWrap = makePlainNode({
  children: () => [hidden],
  selectionEnabled: () => false, // 声明性退出：整棵子树剪枝
});
const root = makePlainNode({
  children: () => [plain, A, B, C, hiddenWrap],
  selectionEnabled: () => true,
});

function hit(node, x, y = 0) {
  return {
    chain: [
      { node: root, x: 0, y: 0 },
      { node, x, y },
    ],
    x,
    y,
    time: 1,
  };
}

// ---------- 管理器装配 ----------

const pointerSelect = createSignal(null);
const moveHitTest = createSignal(null);
const editorPair = createSignal(null);

const mgr = createSelectionManager({
  pointerSelect: pointerSelect.get,
  moveHitTest: moveHitTest.get,
  activeEditorSelPair: () => editorPair.get(),
  // 本节不模拟活跃编辑器（程序化选区走 programmatic 分支），
  // 编辑器本地光标的优先级经 activeEditorSelPair 单独验证
  activeEditor: () => undefined,
  rootNode: () => root,
  clearPointerSelect: () => pointerSelect.set(null),
});

// ---------- 1. 可选集合与初始态 ----------

console.log('1. 可选集合派生');
check('初始无选区', mgr.selectedText(), null);
check('初始 rangeOf(A)', mgr.rangeOf(A), null);
check('初始 selectedRect', mgr.selectedRect(), null);
check('A 可选', mgr.isSelectable(A), true);
check('plain 不可选', mgr.isSelectable(plain), false);
check('hidden 被子树剪枝', mgr.isSelectable(hidden), false);
check('asSelectable2(plain)', asSelectable2(plain), null);
check('asSelectable2(A)', asSelectable2(A), A);

// ---------- 2. 按住中塌缩 ----------

console.log('2. 按住中塌缩无选区');
pointerSelect.set({ press: hit(A, 3), release: null });
check('塌缩 selectedText', mgr.selectedText(), null);
check('塌缩 rangeOf(A)', mgr.rangeOf(A), null);

// ---------- 3. 按住中跨节点拖选（实时） ----------

console.log('3. 按住中跨节点拖选');
pointerSelect.set({ press: hit(A, 2), release: null });
moveHitTest.set(hit(B, 3));
check('实时 selectedText', mgr.selectedText(), 'llo worldSec');
check('实时 rangeOf(A)', JSON.stringify(mgr.rangeOf(A)), '[2,11]');
check('实时 rangeOf(B)', JSON.stringify(mgr.rangeOf(B)), '[0,3]');
check('实时 rangeOf(C)', mgr.rangeOf(C), null);

// ---------- 4. 松手定格 ----------

console.log('4. 松手定格');
pointerSelect.set({ press: hit(A, 2), release: hit(B, 3) });
moveHitTest.set(hit(A, 9)); // hover 不再影响
check('定格 selectedText', mgr.selectedText(), 'llo worldSec');
check('定格锚点为按下端', mgr.anchorSel().node === B ? 'B' : 'A', 'A');
check('定格焦点为释放端', mgr.focusSel().node === B ? 'B' : 'A', 'B');
check('定格锚点偏移', mgr.anchorSel().offset, 2);
check('定格焦点偏移', mgr.focusSel().offset, 3);

// ---------- 5. 空白按下清除 ----------

console.log('5. 空白按下清除（浏览器语义）');
pointerSelect.set({ press: hit(plain, 5), release: null });
check('清除后 selectedText', mgr.selectedText(), null);

// ---------- 6. 编辑器光标优先级 ----------

console.log('6. 五级优先级');
pointerSelect.set(null); // 先撤掉上一节空白按住会话，否则 #1 会压制光标
editorPair.set({
  anchor: { node: C, offset: 0 },
  focus: { node: C, offset: 5 },
});
check('编辑器非塌缩光标', mgr.selectedText(), 'first');
pointerSelect.set({ press: hit(A, 2), release: null });
moveHitTest.set(hit(B, 3));
check('按住指针压制光标', mgr.selectedText(), 'llo worldSec');
pointerSelect.set({ press: hit(A, 2), release: hit(B, 3) });
editorPair.set({
  anchor: { node: B, offset: 2 },
  focus: { node: B, offset: 7 },
});
check('光标压制定格指针', mgr.selectedText(), 'cond ');
editorPair.set({
  anchor: { node: B, offset: 3 },
  focus: { node: B, offset: 3 },
});
check('塌缩光标不压制定格指针', mgr.selectedText(), 'llo worldSec');
pointerSelect.set(null);
check('无指针时塌缩光标无选区', mgr.selectedText(), null);
mgr.select(B, 0, B, 6);
check('塌缩光标压制程序化', mgr.selectedText(), null);
editorPair.set(null);
check('光标撤离后程序化恢复', mgr.selectedText(), 'Second');

// ---------- 7. 程序化指令 ----------

console.log('7. 程序化指令');
mgr.clear();
check('clear 生效', mgr.selectedText(), null);
mgr.selectAll();
check('selectAll 撤除指针会话', pointerSelect.get(), null);
check(
  'selectAll selectedText',
  mgr.selectedText(),
  'Hello worldSecond textfirst\nsecond\nthird'
);
check('selectAll rangeOf(A)', JSON.stringify(mgr.rangeOf(A)), '[0,11]');
check('selectAll rangeOf(C)', JSON.stringify(mgr.rangeOf(C)), '[0,18]');
check(
  'selectAll selectedRect',
  JSON.stringify(mgr.selectedRect()),
  '{"left":0,"top":0,"right":144,"bottom":20}'
);
check('select 已注册', mgr.select(A, 2, B, 5), true);
check('select selectedText', mgr.selectedText(), 'llo worldSecon');
check('select 未注册返回 false', mgr.select(plain, 0), false);
check('select 越界钳制', mgr.select(A, 99, A, 0), true);
check('钳制后锚点偏移', mgr.anchorSel().offset, 11);
check('钳制后 selectedText', mgr.selectedText(), 'Hello world');

// ---------- 8. 反向拖选（B→A） ----------

console.log('8. 反向拖选');
pointerSelect.set({ press: hit(B, 5), release: null });
moveHitTest.set(hit(A, 2));
check('反向按住中 selectedText', mgr.selectedText(), 'llo worldSecon');
pointerSelect.set({ press: hit(B, 5), release: hit(A, 2) });
check('反向松手 selectedText', mgr.selectedText(), 'llo worldSecon');
check('反向锚点仍是按下端 B', mgr.anchorSel().node === B, true);
check('反向焦点是释放端 A', mgr.focusSel().node === A, true);

// ---------- 9. 过期链节点跳过 ----------

console.log('9. 快照链过期节点');
const stale = makeTextNode('stale'); // 不在树上的可选节点
pointerSelect.set({
  press: {
    chain: [
      { node: root, x: 0, y: 0 },
      { node: stale, x: 0, y: 0 },
      { node: B, x: 4, y: 0 },
    ],
    x: 4,
    y: 0,
    time: 1,
  },
  release: null,
});
moveHitTest.set(null);
check('press 跳过过期节点落到 B（塌缩）', mgr.selectedText(), null);
moveHitTest.set(hit(A, 1));
check('跨节点拖选跳过过期节点', mgr.selectedText(), 'ello worldSeco');

// ---------- 10. 词 / 段落数据面 ----------

console.log('10. 词与段落数据面');
check('wordRangeAt(A,7)', JSON.stringify(A.wordRangeAt(7)), '[6,11]');
check('wordRangeAt(A,0)', JSON.stringify(A.wordRangeAt(0)), '[0,5]');
check(
  'wordRangeAt(A,5) 词边界归入前词',
  JSON.stringify(A.wordRangeAt(5)),
  '[0,5]'
);
check('paragraphRangeAt(C,8)', JSON.stringify(C.paragraphRangeAt(8)), '[6,12]');
check('paragraphRangeAt(C,0)', JSON.stringify(C.paragraphRangeAt(0)), '[0,5]');
check(
  'paragraphRangeAt(C,15) 段内偏移',
  JSON.stringify(C.paragraphRangeAt(15)),
  '[13,18]'
);

// ---------- 11. expandWordSelection 纯函数 ----------

console.log('11. expandWordSelection');
check(
  '向左扩展',
  JSON.stringify(
    expandWordSelection(2, 7, 0, o => wordRangeAtIn('Hello world', o))
  ),
  '[0,7]'
);
check(
  '向右扩展',
  JSON.stringify(
    expandWordSelection(2, 7, 8, o => wordRangeAtIn('Hello world', o))
  ),
  '[2,11]'
);
check(
  '锚词内不变',
  JSON.stringify(
    expandWordSelection(2, 7, 5, o => wordRangeAtIn('Hello world', o))
  ),
  '[2,7]'
);
check(
  '无分词退化',
  JSON.stringify(expandWordSelection(2, 7, 0, () => null)),
  '[0,7]'
);

// ---------- 汇总 ----------

console.log(`\n${passed} 通过, ${failed} 失败`);
process.exit(failed > 0 ? 1 : 0);
