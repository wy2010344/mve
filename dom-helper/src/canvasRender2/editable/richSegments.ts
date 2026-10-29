import type {
  RichTextSpan,
  RichTextStyle,
  TextDecoration,
} from '../../canvasCore/Paragraph';
import { expandTabs } from '../../canvasCore/Tab';
import { Graphemes } from '../Graphemes';

/**
 * 段落样式类型在这里转发一次：样式段的读写都用它，调用方（业务 / demo）
 * 不必为了一个类型去 import `canvasCore`。
 */
export type { RichTextSpan, RichTextStyle, TextDecoration };

/**
 * # 富文本样式段（边界表）
 *
 * 对标 Kotlin `RichEditableTextNode` 的 `Segment(end, style)` 边界表，
 * 但**不用继承、不用可变状态**：全部是**纯函数**——吃旧表吐新表。
 *
 * 表示：每段记录自己的**结束偏移**与样式，`i` 位置的样式 = 第一个 `end > i`
 * 的段的样式（`style == null` 表示用基础样式）。表铺满 `[0, 文本长度)`。
 *
 * 为什么是纯函数：
 * - ooc / Rust 侧照抄即可（没有对象方法、没有 this、没有可变字段）；
 * - 状态由调用方持有（canvasRender2 里是一个信号），撤销重做时只需换表。
 */

/** 样式段：覆盖 (prevEnd, end] 区间；`style` 为 null 表示使用基础样式 */
export interface RichSegment {
  readonly end: number;
  readonly style: RichTextStyle | null;
}

/** 空表（ooc 侧就是一个空数组） */
export const emptySegments: readonly RichSegment[] = [];

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * 样式按值比较（字段级；null 与 null 相等）。
 *
 * **逐字段显式比较，不用 `Object.keys` 枚举**：ooc / Rust 侧没有"反射对象成员"
 * 这回事，枚举键的写法搬不过去；逐字段比较在 Rust 就是 `derive(PartialEq)`、
 * 在 ooc 就是逐成员 `==`，是同一段逻辑的直译。
 *
 * 代价：[RichTextStyle] 以后新增字段时，这里要同步加一行。
 */
function styleEq(
  a: RichTextStyle | null | undefined,
  b: RichTextStyle | null | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.fontFamily === b.fontFamily &&
    a.fontSize === b.fontSize &&
    a.fontWeight === b.fontWeight &&
    a.italic === b.italic &&
    a.color === b.color &&
    a.letterSpacing === b.letterSpacing &&
    a.wordSpacing === b.wordSpacing &&
    a.lineHeightMultiplier === b.lineHeightMultiplier &&
    decorationEq(a.decoration, b.decoration)
  );
}

/** 装饰线按值比较（`{underline:true}` 与另一个同值对象必须相等，不能比引用） */
function decorationEq(
  a: TextDecoration | undefined,
  b: TextDecoration | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return !!a.underline === !!b.underline && !!a.lineThrough === !!b.lineThrough;
}

/**
 * 覆盖第 [idx] 个字符的显式样式；无显式段返回 null（即基础样式）。
 * 文本为空时一律返回 null（没有字符可问）。
 */
export function styleAtIn(
  list: readonly RichSegment[],
  text: string,
  idx: number
): RichTextStyle | null {
  if (text.length === 0) return null;
  const i = clamp(idx, 0, text.length - 1);
  for (const seg of list) {
    if (i < seg.end) return seg.style;
  }
  return null;
}

/**
 * 将区间 [start, end) 设为 [style]（null = 回到基础样式）。
 * 不进文本撤销栈——它是"样式"层面的改动，与文本动作分开。
 */
export function setRangeIn(
  list: readonly RichSegment[],
  text: string,
  start: number,
  end: number,
  style: RichTextStyle | null
): readonly RichSegment[] {
  const len = text.length;
  const s = clamp(start, 0, len);
  const e = clamp(end, s, len);
  if (s >= e) return list;
  const out: RichSegment[] = [];
  let prev = 0;
  for (const seg of list) {
    const segStart = prev;
    prev = seg.end;
    if (seg.end <= s || segStart >= e) {
      out.push(seg); // 完全在区间外：整段保留
    } else {
      // 与区间相交：裁剪两侧保留（中间被新段取代）
      if (segStart < s) out.push({ end: s, style: seg.style });
      if (seg.end > e) out.push({ end: seg.end, style: seg.style });
    }
  }
  out.push({ end: e, style });
  return normalizeIn(out, len);
}

/**
 * 文本从 [oldText] 变成 [newText] 后，把样式段按"公共前缀 / 后缀"对齐。
 *
 * 这是富文本编辑器最关键的一处：打字、退格、选区替换、撤销重做、IME 提交
 * 全部经 [EditableParams.onTextChange] 出口，这里按差异平移 / 裁剪，
 * 样式就跟着文本自动维持一致，调用方不需要在每种编辑动作里各写一遍。
 */
export function alignIn(
  list: readonly RichSegment[],
  oldText: string,
  newText: string
): readonly RichSegment[] {
  if (oldText === newText) return list;
  const [p, insEnd] = diffBounds(oldText, newText);
  const delta = newText.length - oldText.length;
  const oldRemoveEnd = insEnd - delta;
  const out: RichSegment[] = [];
  let prev = 0;
  for (const seg of list) {
    const start = prev;
    prev = seg.end;
    if (seg.end <= p) {
      out.push(seg); // 整段在被删区之前：不动
    } else if (start >= oldRemoveEnd) {
      out.push({ end: seg.end + delta, style: seg.style }); // 整段在后：整体平移
    } else {
      // 相交：左半保留到 p，右半接在新插入区之后
      if (start < p) out.push({ end: p, style: seg.style });
      if (seg.end > oldRemoveEnd) {
        out.push({
          end: insEnd + (seg.end - oldRemoveEnd),
          style: seg.style,
        });
      }
    }
  }
  if (insEnd > p) {
    // 新插入区间继承插入点左侧字符的样式（文档首无左邻时取右侧，即 null）
    const inherit =
      oldText.length === 0
        ? null
        : styleAtIn(list, oldText, clamp(p - 1, 0, oldText.length - 1));
    out.push({ end: insEnd, style: inherit });
  }
  return normalizeIn(out, newText.length);
}

/** 公共前缀长度 p 与新串插入终点 insEnd（旧串删除终点 = insEnd - delta） */
function diffBounds(oldText: string, newText: string): [number, number] {
  const m = Math.min(oldText.length, newText.length);
  let p = 0;
  while (p < m && oldText.charAt(p) === newText.charAt(p)) p++;
  let q = 0;
  while (
    q < m - p &&
    oldText.charAt(oldText.length - 1 - q) ===
      newText.charAt(newText.length - 1 - q)
  ) {
    q++;
  }
  return [p, newText.length - q];
}

/** 排序、钳制边界、合并相邻同款，并保证铺满 [0, len] */
export function normalizeIn(
  segments: readonly RichSegment[],
  len: number
): readonly RichSegment[] {
  if (len === 0) return emptySegments;
  const sorted = segments.slice().sort((a, b) => a.end - b.end);
  const out: RichSegment[] = [];
  for (const s of sorted) {
    const e = clamp(s.end, 1, len);
    const last = out[out.length - 1];
    if (!last) {
      out.push({ end: e, style: s.style });
    } else if (e <= last.end) {
      // 被前一段完全覆盖：丢弃
    } else if (styleEq(s.style, last.style)) {
      out[out.length - 1] = { end: e, style: last.style };
    } else {
      out.push({ end: e, style: s.style });
    }
  }
  // 末段补齐到 len：末段永远是基础样式（null），不复用前一段样式
  const last = out[out.length - 1];
  if (!last) {
    out.push({ end: len, style: null });
  } else if (last.end < len) {
    out.push({ end: len, style: null });
  }
  // 最终合并相邻同款：经排序后（交叉段造成的）相邻同款边界收成一条，
  // 例如 700→null→700 不会多出冗余端点。
  const merged: RichSegment[] = [];
  for (const s of out) {
    const lastM = merged[merged.length - 1];
    if (lastM && styleEq(lastM.style, s.style)) {
      merged[merged.length - 1] = { end: s.end, style: s.style };
    } else {
      merged.push({ end: s.end, style: s.style });
    }
  }
  return merged;
}

/**
 * 由样式段 + 当前文本还原内容片段（tab 已展开，与显示层同口径）。
 *
 * 注意：这里用的文本必须是**逻辑文本**（含 '\t'），展开在每个片段内部做，
 * 连起来正好等于 `displayTextOf(text)`。
 */
export function contentSpansIn(
  list: readonly RichSegment[],
  text: string,
  base: RichTextStyle
): readonly RichTextSpan[] {
  if (text.length === 0) return [];
  const out: RichTextSpan[] = [];
  let prev = 0;
  for (const seg of list) {
    const e = Math.min(seg.end, text.length);
    if (e > prev) {
      out.push({
        text: expandTabs(text.substring(prev, e)),
        style: seg.style ?? base,
      });
      prev = e;
      if (prev >= text.length) break;
    }
  }
  if (prev < text.length) {
    out.push({ text: expandTabs(text.substring(prev)), style: base });
  }
  return out;
}

/** 掩码形态的片段：逐字素簇一个圆点，样式取簇起点所在段（相邻同款合并） */
export function obscureSpansIn(
  list: readonly RichSegment[],
  text: string,
  base: RichTextStyle
): readonly RichTextSpan[] {
  const out: RichTextSpan[] = [];
  let i = 0;
  while (i < text.length) {
    const style = styleAtIn(list, text, i) ?? base;
    const last = out[out.length - 1];
    if (last && styleEq(last.style, style)) {
      out[out.length - 1] = { text: last.text + '•', style };
    } else {
      out.push({ text: '•', style });
    }
    i = Graphemes.nextBoundary(text, i);
  }
  return out;
}
