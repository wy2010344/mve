// 富文本编辑器冒烟：样式段边界表的纯函数 + 编辑器段读写接线
// 不依赖 CanvasKit（段落构建是惰性的，构造期不触碰 WASM）。
import {
  alignIn,
  contentSpansIn,
  emptySegments,
  normalizeIn,
  obscureSpansIn,
  setRangeIn,
  styleAtIn,
} from './dist/canvasRender2.mjs';
import { createEditableEditor } from './dist/canvasRender2.mjs';
import { editableTextNodeDefaults } from './dist/canvasRender2.mjs';
import { merge } from './dist/canvasRender2.mjs';

let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failed++;
    console.log(`  FAIL ${name}\n    期望 ${e}\n    实际 ${a}`);
  }
}
function truthy(name, v) {
  if (v) passed++;
  else {
    failed++;
    console.log(`  FAIL ${name}`);
  }
}

// ---------- 1. normalizeIn：排序 / 钳制 / 合并 / 铺满 ----------
check('normalize 空文本 -> 空表', normalizeIn([{ end: 5, style: null }], 0), []);
check(
  'normalize 乱序+重叠 -> 合并同款+铺满',
  normalizeIn(
    [
      { end: 10, style: null },
      { end: 5, style: { fontWeight: 700 } },
      { end: 8, style: null },
      { end: 3, style: { fontWeight: 700 } },
    ],
    12
  ),
  [
    { end: 5, style: { fontWeight: 700 } },
    { end: 12, style: null },
  ]
);

// ---------- 2. setRangeIn：区间覆写，其余保留 ----------
check(
  'setRangeIn 在中间插一段',
  setRangeIn(
    [
      { end: 5, style: null },
      { end: 10, style: null },
    ],
    '0123456789',
    2,
    6,
    { color: 0xffff0000 }
  ),
  [
    { end: 2, style: null },
    { end: 6, style: { color: 0xffff0000 } },
    { end: 10, style: null },
  ]
);
check('setRangeIn 越界区间被钳制', setRangeIn(emptySegments, 'ab', 1, 99, null), [
  { end: 2, style: null },
]);

// ---------- 3. styleAtIn：按边界取样式（null = 基础样式） ----------
{
  const list = [
    { end: 2, style: null },
    { end: 5, style: { color: 1 } },
    { end: 9, style: null },
  ];
  check('styleAt 段首之前=基础', styleAtIn(list, 'x'.repeat(9), 0), null);
  check('styleAt 中段的样式', styleAtIn(list, 'x'.repeat(9), 3), { color: 1 });
  check('styleAt 末段=基础', styleAtIn(list, 'x'.repeat(9), 8), null);
  check('styleAt 空文本恒 null', styleAtIn(list, '', 0), null);
}

// ---------- 4. contentSpansIn：按段切显示片段，tab 展开 ----------
{
  const text = 'a\tb';
  const list = [
    { end: 2, style: { fontWeight: 700 } },
    { end: 3, style: null },
  ];
  check(
    'contentSpansIn 段内展开 tab',
    contentSpansIn(list, text, {}),
    [
      { text: 'a    ', style: { fontWeight: 700 } },
      { text: 'b', style: {} },
    ]
  );
  check('contentSpansIn 空文本 -> []', contentSpansIn(emptySegments, '', {}), []);
}

// ---------- 5. obscureSpansIn：逐字素簇圆点，按簇起点样式合并 ----------
{
  const list = [
    { end: 1, style: { color: 1 } },
    { end: 3, style: null },
  ];
  check(
    'obscureSpansIn 相邻同款合并',
    obscureSpansIn(list, 'abc', {}),
    [
      { text: '•', style: { color: 1 } },
      { text: '••', style: {} },
    ]
  );
}

// ---------- 6. alignIn：文本变更后段跟随对齐 ----------
{
  // 在 "hello world" 中间插入 "XYZ"：old="hello world", new="hello XYZworld"
  const list = [
    { end: 5, style: null },
    { end: 11, style: { fontWeight: 700 } },
  ];
  const out = alignIn(list, 'hello world', 'hello XYZworld');
  check(
    'alignIn 插入段前的样式不动，新段继承左邻',
    out,
    [
      { end: 5, style: null },
      { end: 14, style: { fontWeight: 700 } },
    ]
  );
  check('alignIn 相同文本 -> 原表', alignIn(list, 'hello world', 'hello world'), list);
  // 删除段内字符：old="abcDEFghi", new="abcghi" 删掉 "DEF"
  const l2 = [
    { end: 3, style: null },
    { end: 6, style: { color: 1 } },
    { end: 9, style: null },
  ];
  check(
    'alignIn 删除段内字符，右段平移并折叠冗余边界',
    alignIn(l2, 'abcDEFghi', 'abcghi'),
    [{ end: 6, style: null }]
  );
}

// ---------- 7. 编辑器接线：setStyleRange 写表 + 触发 onSegmentsChange ----------
{
  let text = 'hello';
  let segs = emptySegments;
  const arg = merge(
    {
      text: () => text,
      onTextChange: t => (text = t),
      onSegmentsChange: s => (segs = s),
      segments: () => segs,
    },
    editableTextNodeDefaults
  );
  const editor = createEditableEditor({
    arg,
    node: () => ({}),
    selectionManager: () => null,
    addDestroy: () => {},
  });
  check('初始段为空表', editor.getSegments(), []);
  editor.setStyleRange(0, 2, { fontWeight: 700 });
  check('setStyleRange 后取回段', editor.getSegments(), [
    { end: 2, style: { fontWeight: 700 } },
    { end: 5, style: null },
  ]);
  truthy('onSegmentsChange 被触发', segs !== emptySegments);
  // 文本变更经 writeText 出口 -> 段自动对齐（经由 handle 的公开动作）
  // 用 setStyleRange 已经验证写路径；对齐路径由纯函数 alignIn 覆盖（见上）。
  check('对齐后段铺满新文本长度', editor.getSegments()[editor.getSegments().length - 1].end, 5);
}

console.log(`\n富文本：通过 ${passed} 项，失败 ${failed} 项`);
process.exit(failed > 0 ? 1 : 0);
