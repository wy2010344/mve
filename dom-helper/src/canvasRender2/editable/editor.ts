import { createSignal } from 'wy-helper';
import {
  PlatformParagraph,
  RichTextSpan,
  RichTextStyle,
  TextRect,
} from '../../canvasCore/Paragraph';
import { Graphemes, Words } from '../Graphemes';
import { clipboardGetText, clipboardSetText } from '../Clipboard';
import { repeatEvery } from '../../canvasCore/Timer';
import {
  DeleteTextAction,
  InsertTextAction,
  ReplaceSelectionAction,
  TextState,
  UndoRedo,
} from '../UndoRedo';
import { KeyCode2, KeyEvent2 } from '../tree/protocol';
import {
  EditableTextHandle,
  getActiveEditor,
  InputOverlayRect,
  focusedSignal,
} from '../Focus';
import { Node2, absoluteX, absoluteY, innerSize } from '../Node';
import { Selectable2, SelectionManager2 } from '../SelectionManager';
import { textDefaults } from '../TextDefaults';
import { inkShiftYOf } from '../util';
import { EditableParams } from './params';
import { EditableTextView, coerce, createEditableTextView } from './view';
import {
  alignIn,
  contentSpansIn,
  emptySegments,
  obscureSpansIn,
  setRangeIn,
  type RichSegment,
} from './richSegments';
import { EditableParagraph, createEditableParagraph } from './paragraph';
import { createEditableSelectable } from './selectable';
import {
  caretInsertXOf,
  caretLineIndexOf,
  caretRectsOf,
  linesOf,
  offsetAt,
  offsetOnLineAt,
  scrollXOf,
} from './caret';

/**
 * # 编辑器内核：光标 / 选区 / 编辑动作 / 键盘
 *
 * 这是 canvasRender2 里最大的一块，收在一个对象里（不是 class）：
 * 状态藏在闭包，能力都是消息。节点文件只负责「表现」（draw / size /
 * 把 selectable 与 handle 塞进 exts），交互规则全在这里。
 *
 * ## 两条选区真相，互不写回
 * - **跨组件拖选 / 全选**：由全局 SelectionManager 派生，本内核只读
 *   `rangeOf(selectable)` 拿到分给自己的一段；
 * - **本地光标**（`caretPair = [anchor, focus]`）：编辑器自己的状态，
 *   经 `cursorSelPair()` 喂给 SelectionManager，键盘扩选 / 双击选词时
 *   优先级高于定格的指针选区。
 *
 * ## 组合输入（IME）
 * 组合串不是「已上屏文本」：`compositionBase` 记住被替换的原文，
 * 每次组合更新都重写那一段；`commit` 保留已上屏文本，`endComposition(true)`
 * 才把原文还原回去。
 *
 * 移植到 ooc 时的对应关系：闭包状态 → `storage ref`；`createSignal` →
 * 桥接的同名信号；下面的每个函数 → 对象里的一条消息。
 */

/** 光标宽度（像素） */
export const CURSOR_WIDTH = 2;
/** 光标闪烁间隔（毫秒） */
const BLINK_INTERVAL = 530;
/** PageUp / PageDown 一次跳几行 */
const PAGE_LINES = 12;

/** 光标本地矩形（节点坐标，已含 padding 与单行水平滚动偏移） */
export interface CaretBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 编辑器对外的能力（节点文件与选择器都只经这些消息） */
export interface EditableEditor {
  /** 当前段落（显示文本为空时 null） */
  paragraph(): PlatformParagraph | null;
  /** 显示层（逻辑索引 ↔ 显示索引） */
  view(): EditableTextView;
  /** 可选文本能力（交给 exts 里的 SelectableExt） */
  selectable(): Selectable2;
  /** 编辑器句柄（交给 exts 里的 EditorHandleExt） */
  handle(): EditableTextHandle;
  /** SelectionManager 分配给本节点的选区（逻辑偏移）；null 表示没有 */
  selectionRange(): [number, number] | null;
  /** 光标是否该画（聚焦 + 闪烁相位） */
  cursorVisible(): boolean;
  /** 光标在段落里的显示偏移 */
  cursorDisplayPos(): number;
  /** 单行水平滚动偏移（非单行恒 0） */
  scrollX(): number;
  /** 文本绘制原点 y（内容盒上缘 + 单行墨迹补偿）；绘制 / 选区 / 命中共用 */
  textOriginY(): number;
  /** 输入法组合串的显示区间 [start, end)；无组合时为 null */
  composingDisplayRange(): [number, number] | null;
  /** 光标本地矩形（绘制光标 / 定位 IME 候选框共用） */
  caretLocalRect(): CaretBox | null;
  /** 鼠标按下：把光标落到全局坐标处（已有分配选区时不抢光标） */
  placeCursorAt(globalX: number, globalY: number): void;
  /** 富文本：当前样式段边界表（普通编辑器恒为空表） */
  getSegments(): readonly RichSegment[];
  /** 富文本：把区间 [start, end) 设为 [style]（null = 回到基础样式） */
  setStyleRange(start: number, end: number, style: RichTextStyle | null): void;
}

/** 内核依赖：参数对象 + 节点 + 选择器 + 销毁登记 */
export interface EditableEditorDeps {
  /** 合并过兜底的参数对象 */
  arg: EditableParams;
  /** 当前节点（ref.get；构造期不要调用） */
  node(): Node2;
  /** 全局选择器（未提供时退化为单节点行为） */
  selectionManager(): SelectionManager2 | null;
  /** 登记销毁回调（释放段落 / 停掉闪烁） */
  addDestroy(fn: () => void): void;
}

export function createEditableEditor(deps: EditableEditorDeps): EditableEditor {
  const arg = deps.arg;
  const node = deps.node;
  const textOf = () => arg.text();
  // 富文本样式段（边界表；普通编辑器恒为 emptySegments，不影响排版/选区）
  const segments = createSignal<readonly RichSegment[]>(
    arg.segments?.() ?? emptySegments
  );
  const writeText = (value: string) => {
    const old = textOf();
    arg.onTextChange(value);
    // 文本经唯一出口变更后，把样式段按公共前缀/后缀对齐（不进文本撤销栈）
    if (old !== value) {
      const next = alignIn(segments.get(), old, value);
      segments.set(next);
      arg.onSegmentsChange?.(next);
    }
  };

  // ---------- 显示层 / 段落 ----------
  const view = createEditableTextView({
    text: () => arg.text(),
    placeholder: () => arg.placeholder(),
    obscure: () => arg.obscure(),
  });

  /** 基础样式（未覆盖段的默认外观） */
  const baseStyle = (): RichTextStyle => ({
    fontFamily: arg.fontFamily(),
    fontSize: arg.fontSize(),
    fontWeight: arg.fontWeight(),
    italic: arg.italic(),
    color: view.showingPlaceholder() ? textDefaults.placeholder() : arg.color(),
    letterSpacing: arg.letterSpacing(),
    wordSpacing: arg.wordSpacing(),
    lineHeightMultiplier: arg.lineHeightMultiplier(),
  });
  /** 当前显示片段：占位串 / 掩码 / 样式段三者按同一口径切分 */
  const buildSpans = (): readonly RichTextSpan[] => {
    if (view.showingPlaceholder()) {
      return [{ text: view.displayText(), style: baseStyle() }];
    }
    if (arg.obscure()) {
      return obscureSpansIn(segments.get(), textOf(), baseStyle());
    }
    return contentSpansIn(segments.get(), textOf(), baseStyle());
  };
  const paragraph: EditableParagraph = createEditableParagraph({
    view,
    spans: buildSpans,
    singleLine: () => arg.singleLine(),
    maxLines: () => arg.maxLines(),
    innerWidth: () => innerSize(node(), 'x'),
  });
  const para = () => paragraph.get();

  /**
   * 单行墨迹垂直居中补偿（与 RichTextNode 同口径）：
   * 单行编辑器高度通常比行盒大，不补偿文字会贴在偏下位置。
   * 多行保持自然行高。
   */
  const inkShiftY = () =>
    inkShiftYOf(
      para(),
      view.displayText().length,
      innerSize(node(), 'y'),
      arg.singleLine() || arg.maxLines() === 1
    );

  /** 文本原点 y：绘制、光标矩形、选区、命中全部经它，保证"看到的 = 点到的" */
  const textOriginY = (): number => node().paddingBlockStart() + inkShiftY();

  // ---------- 本地光标 / 选区（唯一可变事实：caretPair = [anchor, focus]） ----------
  const caretPair = createSignal<[number, number] | null>(null);
  const anchorIndex = () => caretPair.get()?.[0] ?? -1;
  const focusIndex = () => caretPair.get()?.[1] ?? -1;
  const cursor = () =>
    anchorIndex() >= 0 ? coerce(anchorIndex(), 0, textOf().length) : 0;
  const selAnchor = () => (anchorIndex() >= 0 ? anchorIndex() : cursor());
  // 用钳制后的边界比较：文本被外部改短时残留的越界端点不应当成"有选区"，
  // 否则 replaceSel 里 s === e 会回落到 insertText 形成相互递归（栈溢出）。
  const localSelStart = () =>
    coerce(Math.min(anchorIndex(), focusIndex()), 0, textOf().length);
  const localSelEnd = () =>
    coerce(Math.max(anchorIndex(), focusIndex()), 0, textOf().length);
  const localHasSel = () =>
    anchorIndex() >= 0 && focusIndex() >= 0 && localSelEnd() > localSelStart();

  const setCursor = (idx: number) => {
    const c = coerce(idx, 0, textOf().length);
    caretPair.set([c, c]);
  };
  const extendTo = (pos: number) =>
    caretPair.set([selAnchor(), coerce(pos, 0, textOf().length)]);
  const moveTo = (pos: number, extend: boolean) =>
    extend ? extendTo(pos) : setCursor(pos);

  // ---------- 富文本样式段 ----------
  /** 把 [start, end) 设为 [style]（null = 回到基础样式），触发重绘与导出 */
  const setStyleRange = (
    start: number,
    end: number,
    style: RichTextStyle | null
  ) => {
    const next = setRangeIn(segments.get(), textOf(), start, end, style);
    segments.set(next);
    arg.onSegmentsChange?.(next);
  };

  // ---------- 输入法组合态 ----------
  const composingText = createSignal('');
  const composingCursorPos = createSignal(0);
  let compositionBase: [number, string] | null = null;
  const composingStart = () =>
    coerce(compositionBase?.[0] ?? cursor(), 0, textOf().length);

  // ---------- 撤销重做 ----------
  const undoRedo = new UndoRedo(arg.maxHistorySize);

  // ---------- 光标闪烁（仅聚焦时） ----------
  const cursorVisible = createSignal(true);
  /** 上下移动要记住的视觉列（NaN = 无） */
  let preferredX = NaN;
  // 闪烁节奏交给宿主调度器（浏览器 setInterval / Kotlin 协程 / 测试假时钟）：
  // 编辑器层不直接碰定时器 API，否则 ooc / Rust 侧要各写一份。
  // 只在聚焦时翻转；失焦立刻恢复成"亮"，避免光标停在下一次重绘才消失。
  const stopBlink = repeatEvery(BLINK_INTERVAL, () => {
    if (focusedSignal.get() === node()) {
      cursorVisible.set(!cursorVisible.get());
    } else if (!cursorVisible.get()) {
      cursorVisible.set(true);
    }
  });
  // 节点销毁时停止闪烁：否则闭包会持有节点与全部信号，泄漏且空转重绘
  deps.addDestroy(stopBlink);
  deps.addDestroy(() => paragraph.dispose());

  // ---------- 可选文本能力（塞进 exts，供选择器全树遍历发现） ----------
  const selectable = createEditableSelectable({
    text: textOf,
    view,
    paragraph: para,
    node,
    selectionManager: deps.selectionManager,
    scrollX: () => computeScrollX(),
    textOriginY,
  });

  // ---------- 编辑动作 ----------
  /** 无选区时按光标插入（与 replaceSel 的解耦点，避免两者相互递归） */
  const insertAtCursor = (t: string) => {
    const pos = cursor();
    undoRedo.push(new InsertTextAction(pos, t));
    writeText(textOf().slice(0, pos) + t + textOf().slice(pos));
    setCursor(pos + t.length);
  };
  const replaceSel = (replacement: string) => {
    const s = localSelStart();
    const e = localSelEnd();
    if (s === e) {
      insertAtCursor(replacement);
      return;
    }
    undoRedo.push(
      new ReplaceSelectionAction(s, textOf().substring(s, e), replacement)
    );
    writeText(textOf().slice(0, s) + replacement + textOf().slice(e));
    setCursor(s + replacement.length);
  };
  const insertText = (inserted: string) => {
    if (arg.readOnly()) return;
    const t = arg.singleLine()
      ? inserted.replace(/\n/g, '').replace(/\r/g, '')
      : inserted;
    if (t.length === 0) return;
    if (localHasSel()) {
      replaceSel(t);
      return;
    }
    insertAtCursor(t);
  };
  const delSel = () => {
    if (!localHasSel()) return;
    const s = localSelStart();
    const e = localSelEnd();
    undoRedo.push(new DeleteTextAction(s, textOf().substring(s, e), true));
    writeText(textOf().slice(0, s) + textOf().slice(e));
    setCursor(s);
  };
  const backspace = () => {
    if (localHasSel()) return delSel();
    const pos = cursor();
    if (pos <= 0) return;
    const start = Graphemes.prevBoundary(textOf(), pos);
    if (start >= pos) return;
    undoRedo.push(
      new DeleteTextAction(start, textOf().substring(start, pos), true)
    );
    writeText(textOf().slice(0, start) + textOf().slice(pos));
    setCursor(start);
  };
  const deleteForward = () => {
    if (localHasSel()) return delSel();
    const pos = cursor();
    if (pos >= textOf().length) return;
    const end = Graphemes.nextBoundary(textOf(), pos);
    if (end <= pos) return;
    undoRedo.push(
      new DeleteTextAction(pos, textOf().substring(pos, end), false)
    );
    writeText(textOf().slice(0, pos) + textOf().slice(end));
    setCursor(pos);
  };
  const deleteWordBackward = () => {
    if (localHasSel()) return delSel();
    const pos = cursor();
    if (pos <= 0) return;
    const start = Words.prevBoundary(textOf(), pos);
    if (start >= pos) return;
    undoRedo.push(
      new DeleteTextAction(start, textOf().substring(start, pos), true)
    );
    writeText(textOf().slice(0, start) + textOf().slice(pos));
    setCursor(start);
    preferredX = NaN;
  };
  const deleteWordForward = () => {
    if (localHasSel()) return delSel();
    const pos = cursor();
    if (pos >= textOf().length) return;
    const end = Words.nextBoundary(textOf(), pos);
    if (end <= pos) return;
    undoRedo.push(
      new DeleteTextAction(pos, textOf().substring(pos, end), false)
    );
    writeText(textOf().slice(0, pos) + textOf().slice(end));
    setCursor(pos);
    preferredX = NaN;
  };

  // ---------- 行 / 文档 / 词 / 页 导航 ----------
  const lineRangeAt = (pos: number): [number, number] | null => {
    const p = para();
    if (!p) return null;
    if (textOf().length === 0) return null;
    const dispPos = view.logicToDisplay(pos);
    const lines = linesOf(p);
    const m =
      lines.find(l => dispPos >= l.start && dispPos < l.end) ??
      (pos === textOf().length ? lines[lines.length - 1] : null);
    if (!m) return null;
    const display = view.displayText();
    let displayEnd = Math.min(m.end, display.length);
    if (displayEnd > m.start && display.charAt(displayEnd - 1) === '\n') {
      displayEnd--;
    }
    if (displayEnd > m.start && display.charAt(displayEnd - 1) === '\r') {
      displayEnd--;
    }
    return [view.displayToLogic(m.start), view.displayToLogic(displayEnd)];
  };
  const lineStart = (pos: number) => lineRangeAt(pos)?.[0] ?? 0;
  const lineEnd = (pos: number) => lineRangeAt(pos)?.[1] ?? textOf().length;

  const moveLeft = () => {
    const p = cursor();
    if (p > 0) setCursor(Graphemes.prevBoundary(textOf(), p));
  };
  const moveRight = () => {
    const p = cursor();
    if (p < textOf().length) setCursor(Graphemes.nextBoundary(textOf(), p));
  };
  const movePrevWord = () => setCursor(Words.prevBoundary(textOf(), cursor()));
  const moveNextWord = () => setCursor(Words.nextBoundary(textOf(), cursor()));
  /** 按词扩选：锚点保持，焦点跳到上一个 / 下一个词边界 */
  const selectPrevWord = () =>
    caretPair.set([selAnchor(), Words.prevBoundary(textOf(), focusIndex())]);
  const selectNextWord = () =>
    caretPair.set([selAnchor(), Words.nextBoundary(textOf(), focusIndex())]);
  /** 行首 / 行尾 / 文首 / 文末（扩选版本保留锚点） */
  const moveHome = () => setCursor(lineStart(focusIndex()));
  const moveEnd = () => setCursor(lineEnd(focusIndex()));
  const selectHome = () => extendTo(lineStart(focusIndex()));
  const selectEnd = () => extendTo(lineEnd(focusIndex()));
  const moveDocStart = () => setCursor(0);
  const moveDocEnd = () => setCursor(textOf().length);
  const selectDocStart = () => extendTo(0);
  const selectDocEnd = () => extendTo(textOf().length);

  /** 光标矩形（段落坐标系） */
  const caretRect = (): TextRect[] => {
    const p = para();
    if (!p) return [];
    return caretRectsOf(p, view.logicToDisplay(focusIndex()));
  };

  /** 光标矩形 + 插入点横坐标（preferredX 的来源） */
  const caretMetrics = (): { rect: TextRect; x: number } | null => {
    const p = para();
    if (!p) return null;
    const dpos = view.logicToDisplay(focusIndex());
    const rect = caretRectsOf(p, dpos)[0];
    if (!rect) return null;
    return { rect, x: caretInsertXOf(p, dpos) ?? rect.left };
  };

  /** 跳到第 [index] 条软行（保持 preferredX 视觉列） */
  const moveToLine = (index: number, extend: boolean) => {
    const p = para();
    if (!p) return;
    const offset = offsetOnLineAt(p, index, preferredX);
    if (offset == null) return;
    moveTo(view.displayToLogic(offset), extend);
  };

  /** 上下移动一行（[dir] -1 上 / 1 下），保持 preferredX 视觉列 */
  const verticalMove = (dir: 1 | -1, extend = false) => {
    const m = caretMetrics();
    if (!m) return moveTo(dir < 0 ? 0 : textOf().length, extend);
    if (Number.isNaN(preferredX)) preferredX = m.x;
    const p = para();
    if (!p) return;
    const lines = linesOf(p);
    if (lines.length <= 1) return;
    const i = caretLineIndexOf(p, m.rect);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= lines.length) return;
    moveToLine(j, extend);
  };
  const moveUp = () => verticalMove(-1);
  const moveDown = () => verticalMove(1);
  const selectLeft = () => {
    const a = selAnchor();
    const f = focusIndex();
    if (f > 0) caretPair.set([a, Graphemes.prevBoundary(textOf(), f)]);
  };
  const selectRight = () => {
    const a = selAnchor();
    const f = focusIndex();
    if (f < textOf().length) {
      caretPair.set([a, Graphemes.nextBoundary(textOf(), f)]);
    }
  };
  const selectUp = () => verticalMove(-1, true);
  const selectDown = () => verticalMove(1, true);
  const jumpLines = (count: number, extend: boolean) => {
    const m = caretMetrics();
    if (!m) return moveTo(count < 0 ? 0 : textOf().length, extend);
    if (Number.isNaN(preferredX)) preferredX = m.x;
    const p = para();
    if (!p) return;
    const lines = linesOf(p);
    if (lines.length === 0) return;
    const i = caretLineIndexOf(p, m.rect);
    if (i < 0) return;
    const j = coerce(i + count, 0, lines.length - 1);
    if (j === i) return;
    moveToLine(j, extend);
  };

  /** 单行水平滚动偏移：让光标留在内容盒内 */
  const computeScrollX = (): number => {
    if (!arg.singleLine()) return 0;
    const p = para();
    if (!p) return 0;
    const box = Math.max(1, innerSize(node(), 'x'));
    return scrollXOf(
      p,
      box,
      caretRectsOf(p, view.logicToDisplay(focusIndex()))[0] ?? null
    );
  };

  /** 光标本地矩形（含 padding 与水平滚动偏移） */
  const caretLocalRect = (): CaretBox | null => {
    const r = caretRect()[0];
    if (!r) return null;
    const self = node();
    return {
      x: r.left + self.paddingInlineStart() - computeScrollX(),
      y: r.top + textOriginY(),
      w: Math.max(CURSOR_WIDTH, r.right - r.left),
      h: Math.max(arg.fontSize(), r.bottom - r.top),
    };
  };

  // ---------- 撤销 / 重做 ----------
  const applyState = (s: TextState) => {
    writeText(s.text);
    setCursor(s.cursor);
  };
  const undo = () => {
    if (composingText.get().length > 0) return;
    const s = undoRedo.undo(new TextState(textOf(), cursor()));
    if (s) applyState(s);
  };
  const redo = () => {
    if (composingText.get().length > 0) return;
    const s = undoRedo.redo(new TextState(textOf(), cursor()));
    if (s) applyState(s);
  };

  // ---------- 选区吸收 / 组合串收尾 ----------
  /** 本地还没有光标时，把选择器分配给本节点的那段吸收进来 */
  const absorbGlobalSelection = () => {
    if (anchorIndex() >= 0 && focusIndex() >= 0) return;
    const r = deps.selectionManager()?.rangeOf(selectable);
    if (r) caretPair.set([r[0], r[1]]);
  };

  /**
   * 提交组合串：清掉组合态但保留已上屏文本（compositionend / 空串上报）。
   * 与 [endComposition] 的区别：后者会把窗口文本回退掉。
   */
  const commitComposition = () => {
    const start = compositionBase?.[0];
    const winLen = composingText.get().length;
    compositionBase = null;
    composingText.set('');
    composingCursorPos.set(0);
    preferredX = NaN;
    if (start != null) setCursor(coerce(start + winLen, 0, textOf().length));
  };

  /** 结束组合：`restore` 为真时把被替换的原文还原回去 */
  const endComposition = (restore: boolean) => {
    const base = compositionBase;
    const winLen = composingText.get().length;
    compositionBase = null;
    composingText.set('');
    composingCursorPos.set(0);
    preferredX = NaN;
    if (base == null && winLen === 0) return;
    const start = base?.[0] ?? coerce(cursor(), 0, textOf().length);
    const restored = restore ? (base?.[1] ?? '') : '';
    const cur = textOf();
    if (start <= cur.length) {
      const next =
        cur.substring(0, start) +
        restored +
        cur.substring(Math.min(start + winLen, cur.length));
      if (next !== cur) writeText(next);
    }
    setCursor(start);
  };

  // ---------- 编辑器句柄（Renderer 的键盘 / IME / 剪贴板都路由到这里） ----------
  const handle: EditableTextHandle = {
    cursorSelPair() {
      if (getActiveEditor() !== handle) return null;
      const a = anchorIndex();
      const f = focusIndex();
      if (a < 0 || f < 0) return null;
      const len = textOf().length;
      return {
        anchor: { node: selectable, offset: coerce(a, 0, len) },
        focus: { node: selectable, offset: coerce(f, 0, len) },
      };
    },
    hasSelection() {
      const r = deps.selectionManager()?.rangeOf(selectable) ?? null;
      return r ? r[1] > r[0] : false;
    },
    cut() {
      if (arg.readOnly()) return;
      absorbGlobalSelection();
      if (!localHasSel()) return;
      clipboardSetText(textOf().substring(localSelStart(), localSelEnd()));
      delSel();
    },
    copy() {
      absorbGlobalSelection();
      if (!localHasSel()) return;
      clipboardSetText(textOf().substring(localSelStart(), localSelEnd()));
    },
    paste() {
      const t = clipboardGetText();
      if (!t) return;
      preferredX = NaN;
      endComposition(false);
      insertText(t);
    },
    selectAll() {
      caretPair.set([0, textOf().length]);
    },
    selectRange(anchorOffset: number, focusOffset: number) {
      // 双击选词 / 三击选段 / 程序化选区：写入本地光标，使其成为"非塌缩光标"，
      // 从而在 SelectionManager 的派生链里抢占优先级 #2（对齐 Kotlin selectRange）
      const len = textOf().length;
      preferredX = NaN;
      caretPair.set([
        coerce(anchorOffset, 0, len),
        coerce(focusOffset, 0, len),
      ]);
    },
    collapseExternalSelection() {
      if (anchorIndex() >= 0 && focusIndex() !== anchorIndex()) {
        caretPair.set([anchorIndex(), anchorIndex()]);
      }
    },
    onComposing(t: string, cursorPosition: number) {
      if (arg.readOnly()) return;
      if (t.length === 0) {
        commitComposition();
        return;
      }
      absorbGlobalSelection();
      const cur = textOf();
      let start: number;
      let winLen: number;
      if (compositionBase) {
        start = compositionBase[0];
        winLen = composingText.get().length;
      } else {
        const s = localHasSel()
          ? localSelStart()
          : coerce(cursor(), 0, cur.length);
        const e = localHasSel() ? localSelEnd() : s;
        compositionBase = [s, cur.substring(s, e)];
        start = s;
        winLen = e - s;
      }
      const headEnd = Math.min(start, cur.length);
      const tailStart = Math.min(start + winLen, cur.length);
      writeText(cur.substring(0, headEnd) + t + cur.substring(tailStart));
      setCursor(start + t.length);
      composingText.set(t);
      composingCursorPos.set(coerce(cursorPosition, 0, t.length));
    },
    commitComposingText(finalText: string) {
      if (finalText.length > 0) {
        handle.onComposing(finalText, finalText.length);
      }
      commitComposition();
    },
    inputOverlay(): InputOverlayRect | null {
      const r = caretLocalRect();
      const self = node();
      return {
        x: absoluteX(self) + (r ? r.x : self.paddingInlineStart()),
        y: absoluteY(self) + (r ? r.y : textOriginY()),
        w: r ? r.w : 1,
        h: r ? r.h : arg.fontSize(),
        fontSize: arg.fontSize(),
      };
    },
    handleKey(e: KeyEvent2): boolean {
      if (arg.readOnly()) return false;
      absorbGlobalSelection();
      const key = e.key.toLowerCase();
      if (e.ctrl && !e.shift && key === 'z') {
        undo();
        return true;
      }
      if ((e.ctrl && key === 'y') || (e.ctrl && e.shift && key === 'z')) {
        redo();
        return true;
      }
      switch (e.code) {
        case KeyCode2.Backspace:
          if (e.ctrl || e.alt) deleteWordBackward();
          else backspace();
          preferredX = NaN;
          return true;
        case KeyCode2.Delete:
          if (e.ctrl || e.alt) deleteWordForward();
          else deleteForward();
          preferredX = NaN;
          return true;
        case KeyCode2.Left:
          if (e.ctrl && e.shift) selectPrevWord();
          else if (e.ctrl) movePrevWord();
          else if (e.shift) selectLeft();
          else moveLeft();
          preferredX = NaN;
          return true;
        case KeyCode2.Right:
          if (e.ctrl && e.shift) selectNextWord();
          else if (e.ctrl) moveNextWord();
          else if (e.shift) selectRight();
          else moveRight();
          preferredX = NaN;
          return true;
        case KeyCode2.Home:
          if (e.ctrl && e.shift) selectDocStart();
          else if (e.ctrl) moveDocStart();
          else if (e.shift) selectHome();
          else moveHome();
          preferredX = NaN;
          return true;
        case KeyCode2.End:
          if (e.ctrl && e.shift) selectDocEnd();
          else if (e.ctrl) moveDocEnd();
          else if (e.shift) selectEnd();
          else moveEnd();
          preferredX = NaN;
          return true;
        case KeyCode2.PageUp:
          jumpLines(-PAGE_LINES, e.shift);
          return true;
        case KeyCode2.PageDown:
          jumpLines(PAGE_LINES, e.shift);
          return true;
        case KeyCode2.Up:
          if (e.shift) selectUp();
          else moveUp();
          return true;
        case KeyCode2.Down:
          if (e.shift) selectDown();
          else moveDown();
          return true;
        case KeyCode2.Enter:
          // 单行：回车即提交；多行：回车换行，Ctrl/Cmd+Enter 才提交
          if (arg.singleLine()) arg.onSubmit();
          else if (e.ctrl || e.meta) arg.onSubmit();
          else insertText('\n');
          preferredX = NaN;
          return true;
        case KeyCode2.Tab:
          // 默认不消费 Tab，交给上层做焦点遍历；tabInsert 开启时才插入制表符
          if (arg.tabInsert() && !arg.singleLine()) {
            insertText('\t');
            return true;
          }
          return false;
        default: {
          if (e.ctrl || e.alt) return false;
          // 组合态下键盘由输入法独占（此时 key 多为 'Process'），不再按可打印字符插入
          if (composingText.get().length > 0) return false;
          // 只认单字符：'Shift' / 'CapsLock' / 'F5' / 'Process' 等键名一律不录入
          const code = e.key.length === 1 ? e.key.charCodeAt(0) : 0;
          if (code < 0x20 || code === 0x7f) return false;
          preferredX = NaN;
          endComposition(false);
          insertText(e.key);
          return true;
        }
      }
    },
    asSelectable() {
      return selectable;
    },

    // ---------- 公开编辑动作（工具栏 / 快捷键面板可直接调） ----------
    canUndo: () => undoRedo.canUndo(),
    canRedo: () => undoRedo.canRedo(),
    undo: () => undo(),
    redo: () => redo(),
    moveHome,
    moveEnd,
    selectHome,
    selectEnd,
    moveDocStart,
    moveDocEnd,
    selectDocStart,
    selectDocEnd,
    movePrevWord,
    moveNextWord,
    selectPrevWord,
    selectNextWord,
    deleteForward: () => deleteForward(),
    moveCursorTo(offset: number) {
      preferredX = NaN;
      setCursor(offset);
    },
  };

  return {
    paragraph: para,
    view: () => view,
    selectable: () => selectable,
    handle: () => handle,
    selectionRange() {
      return deps.selectionManager()?.rangeOf(selectable) ?? null;
    },
    cursorVisible: () => cursorVisible.get(),
    cursorDisplayPos: () => view.logicToDisplay(cursor()),
    scrollX: computeScrollX,
    textOriginY,
    composingDisplayRange() {
      if (composingText.get().length === 0) return null;
      const start = composingStart();
      return [
        view.logicToDisplay(start),
        view.logicToDisplay(start + composingText.get().length),
      ];
    },
    caretLocalRect,
    placeCursorAt(globalX: number, globalY: number) {
      preferredX = NaN;
      const r = deps.selectionManager()?.rangeOf(selectable);
      if (r && r[1] > r[0]) return; // 已有分配选区时由拖拽接管，不抢光标
      setCursor(selectable.positionForPoint(globalX, globalY));
    },
    getSegments: () => segments.get(),
    setStyleRange,
  };
}
