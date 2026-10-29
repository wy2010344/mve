import { Graphemes } from '../Graphemes';
import { displayToLogic, expandTabs, logicToDisplay } from '../TabRender';

/**
 * # 编辑器的「显示层」：逻辑文本 ↔ 屏幕上那串字符
 *
 * 三件事按优先级叠加，且**只影响显示**（模型文本永远是 `text()` 原文）：
 * 1. **占位**：逻辑文本为空且有占位串 → 显示占位串（不可编辑、不参与选区）；
 * 2. **掩码**：每个字素簇显示成一个 `•`（长度按字素簇算，不是 UTF-16 长度）；
 * 3. **tab 展开**：CanvasKit 对 `'\t'` 的宽度未定义，统一展开成空格。
 *
 * 因此「逻辑索引」（模型文本偏移）与「显示索引」（段落里的偏移）不是一回事，
 * 光标的命中 / 绘制 / 选区高亮都必须先经这里换算。
 *
 * 本模块无状态：只读三个 getter（ooc: 一个对象，三个方法各读一条消息）。
 */

/** 把值钳制到 [lo, hi]（文本偏移一律用它，避免越界索引） */
export function coerce(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** 掩码模式下每个字素簇显示的字符 */
const OBSCURE_CHAR = '•';

/** 是否正在显示占位串（逻辑文本为空 + 有占位串） */
export function isShowingPlaceholder(
  text: string,
  placeholder: string
): boolean {
  return text.length === 0 && placeholder.length > 0;
}

/**
 * 显示文本（占位 / 掩码 / tab 展开三选一）。
 *
 * 抽成纯函数：编辑器内核、普通编辑器、富文本编辑器都要按**同一口径**算
 * 显示文本（span 文本连起来必须等于它，否则段落里的索引会和光标算的对不上）。
 */
export function displayTextOf(
  text: string,
  placeholder: string,
  obscure: boolean
): string {
  if (isShowingPlaceholder(text, placeholder)) return placeholder;
  if (!obscure) return expandTabs(text);
  // 掩码：按字素簇推进（一个 emoji + 修饰符也只显示一个点）
  let s = '';
  let i = 0;
  while (i < text.length) {
    s += OBSCURE_CHAR;
    i = Graphemes.nextBoundary(text, i);
  }
  return s;
}

export interface EditableTextView {
  /** 是否正在显示占位文本 */
  showingPlaceholder(): boolean;
  /** 显示文本（占位 / 掩码 / tab 展开三选一） */
  displayText(): string;
  /** 逻辑索引 → 显示索引 */
  logicToDisplay(pos: number): number;
  /** 显示索引 → 逻辑索引 */
  displayToLogic(dpos: number): number;
}

/** 读取显示层所需的三个事实（都是消息，调用时求值） */
export interface EditableTextViewSource {
  text(): string;
  placeholder(): string;
  obscure(): boolean;
}

export function createEditableTextView(
  source: EditableTextViewSource
): EditableTextView {
  function showingPlaceholder(): boolean {
    return isShowingPlaceholder(source.text(), source.placeholder());
  }

  function displayText(): string {
    return displayTextOf(source.text(), source.placeholder(), source.obscure());
  }

  function logicToDisplayIndex(pos: number): number {
    if (showingPlaceholder()) return 0;
    const t = source.text();
    const limit = coerce(pos, 0, t.length);
    if (!source.obscure()) return logicToDisplay(t, limit);
    let i = 0;
    let n = 0;
    while (i < limit) {
      const next = Graphemes.nextBoundary(t, i);
      if (next > limit) break;
      i = next;
      n++;
    }
    return n;
  }

  function displayToLogicIndex(dpos: number): number {
    if (showingPlaceholder()) return 0;
    const t = source.text();
    if (!source.obscure()) return displayToLogic(t, dpos);
    let i = 0;
    let n = 0;
    while (i < t.length && n < dpos) {
      i = Graphemes.nextBoundary(t, i);
      n++;
    }
    return i;
  }

  return {
    showingPlaceholder,
    displayText,
    logicToDisplay: logicToDisplayIndex,
    displayToLogic: displayToLogicIndex,
  };
}
