import { createSignal, GetValue, memo } from 'wy-helper';
import { ColorInt, colorToCSS, rgba } from '../canvasRender/Draw';
import {
  INT_MAX_VALUE,
  RectStyle,
  RichTextSpan,
  TextAlign,
  buildParagraph,
} from '../canvasRender/PlatformParagraph';
import { drawParagraph } from '../canvasRender/CanvasKitLoader';
import {
  absoluteX,
  absoluteY,
  Fc,
  innerSize,
  LayoutSize,
  layoutSize,
  MouseEvent2,
  Node2,
  node2,
  tfc,
} from './Node';
import { textDefaults } from './TextDefaults';
import { RectF } from './Geometry';
import { expandTabs, logicToDisplay, displayToLogic } from './TabRender';
import { Graphemes, Words } from './Graphemes';
import {
  activeEditorSignal,
  EditableTextHandle,
  focusedSignal,
  InputOverlayRect,
  KeyCode2,
  KeyEvent2,
} from './Focus';
import {
  Rect2,
  SelPair2,
  Selectable2,
  selectionManagerContext,
} from './SelectionManager';
import { clipboardGetText, clipboardSetText } from './Clipboard';
import {
  DeleteTextAction,
  InsertTextAction,
  ReplaceSelectionAction,
  TextState,
  UndoRedo,
} from './UndoRedo';

/** 编辑器参数（对标 Kotlin EditableTextNode 构造 + WrappedTextNode 文本样式） */
export interface EditableTextNodeArg {
  /** 逻辑文本真相源（UTF-16 串）；编辑器写入经 onTextChange 回传 */
  text: GetValue<string>;
  /** 文本变更回写（编辑器内部改动落点） */
  onTextChange?: (text: string) => void;
  /** 占位文本，逻辑文本为空时显示，不参与编辑与选区 */
  placeholder?: GetValue<string>;
  /** 密码模式：每个字素簇显示为一个圆点 */
  obscure?: GetValue<boolean>;
  /** 单行输入（不折行，溢出水平跟随光标） */
  singleLine?: GetValue<boolean>;
  /** 最大行数，默认单行 1 / 多行 INT_MAX_VALUE */
  maxLines?: GetValue<number>;
  /** 提交回调：单行回车 / 多行 Ctrl+Enter 触发 */
  onSubmit?: () => void;
  /** 只读 */
  readOnly?: GetValue<boolean>;
  /** 撤销历史容量（动作式栈） */
  maxHistorySize?: number;
  // 文本样式（同 WrappedTextNode）
  width?: GetValue<number>;
  height?: GetValue<number>;
  fontFamily?: GetValue<string | null>;
  fontSize?: GetValue<number>;
  fontWeight?: GetValue<number>;
  italic?: GetValue<boolean>;
  color?: GetValue<ColorInt>;
  lineHeightMultiplier?: GetValue<number | null>;
  letterSpacing?: GetValue<number>;
  wordSpacing?: GetValue<number>;
  selectionColor?: GetValue<ColorInt>;
  padding?: any;
  paddingInline?: any;
  paddingBlock?: any;
  focusable?: boolean;
  focusOrder?: number | null;
  x?: GetValue<number>;
  y?: GetValue<number>;
}

const coerce = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

/** 段落坐标系里的矩形（getRectsForRange 的返回项） */
interface CaretRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * canvasRender2 版可编辑文本节点（对标 Kotlin EditableTextNode，最大的一块）。
 *
 * 与 Kotlin 类继承不同，这里用函数式工厂：节点身份由 node2 创建，编辑器行为
 * （光标 / 本地选区 / 键盘 / 剪贴板 / IME / 撤销重做）以方法挂在 node 上，
 * 并同时实现 Selectable2（供 SelectionManager 派生全局选区）与 EditableTextHandle
 * （供 Renderer 路由键盘 / IME / 剪贴板快捷键）。
 *
 * 选区真相双轨：
 * - 跨组件拖选 / 全选由全局 SelectionManager 派生（rangeOf(self) 读取）；
 * - 编辑器本地光标（caretPair）经 activeEditorSignal 喂给 SelectionManager 的
 *   activeEditorSelPair，键盘扩选 / 双击选词时优先级高于定格指针选区。
 */
export const editableTextNode = tfc(function (
  ctx,
  node,
  arg: EditableTextNodeArg
) {
  const {
    text,
    onTextChange,
    placeholder = () => '',
    obscure = () => false,
    singleLine = () => false,
    maxLines: maxLinesArg,
    onSubmit,
    readOnly = () => false,
    maxHistorySize = 100,
    fontFamily = () => null,
    fontSize = () => 16,
    fontWeight = () => 400,
    italic = () => false,
    color = () => textDefaults.text,
    lineHeightMultiplier = () => 1.4,
    letterSpacing = () => 0,
    wordSpacing = () => 0,
    selectionColor = () => rgba(80, 140, 255, 80),
    ...rest
  } = arg;

  const self = node as Node2 &
    Selectable2 &
    EditableTextHandle & { mouseDown?: (e: MouseEvent2) => void };

  // 编辑器默认可聚焦
  node.focusable = true;

  /** 单行默认 1 行，多行默认不限（对齐 Kotlin EditableTextNode 构造） */
  const maxLines = maxLinesArg ?? (() => (singleLine() ? 1 : INT_MAX_VALUE));

  const selectionManager = ctx.consume(selectionManagerContext);

  // ---------- 本地光标 / 选区（唯一可变事实：caretPair = [anchor, focus]） ----------
  const caretPair = createSignal<[number, number] | null>(null);
  const anchorIndex = () => caretPair.get()?.[0] ?? -1;
  const focusIndex = () => caretPair.get()?.[1] ?? -1;
  const cursor = () =>
    anchorIndex() >= 0 ? coerce(anchorIndex(), 0, text().length) : 0;
  const selAnchor = () => (anchorIndex() >= 0 ? anchorIndex() : cursor());
  // 用钳制后的边界比较：文本被外部改短时残留的越界端点不应当成"有选区"，
  // 否则 replaceSel 里 s === e 会回落到 insertText 形成相互递归（栈溢出）。
  const localHasSel = () =>
    anchorIndex() >= 0 && focusIndex() >= 0 && localSelEnd() > localSelStart();
  const localSelStart = () =>
    coerce(Math.min(anchorIndex(), focusIndex()), 0, text().length);
  const localSelEnd = () =>
    coerce(Math.max(anchorIndex(), focusIndex()), 0, text().length);

  const setCursor = (idx: number) => {
    const c = coerce(idx, 0, text().length);
    caretPair.set([c, c]);
  };
  const extendTo = (newPos: number) =>
    caretPair.set([selAnchor(), coerce(newPos, 0, text().length)]);
  const moveTo = (newPos: number, extend: boolean) =>
    extend ? extendTo(newPos) : setCursor(newPos);

  // ---------- 显示层（占位 / 掩码 / tab 展开） ----------
  const showingPlaceholder = () =>
    text().length === 0 && placeholder().length > 0;
  const displayText = (): string => {
    if (showingPlaceholder()) return placeholder();
    if (obscure()) {
      let s = '';
      let i = 0;
      const t = text();
      while (i < t.length) {
        s += '•';
        i = Graphemes.nextBoundary(t, i);
      }
      return s;
    }
    return expandTabs(text());
  };
  const logicToDisplayIndex = (pos: number): number => {
    if (showingPlaceholder()) return 0;
    const t = text();
    const limit = coerce(pos, 0, t.length);
    if (obscure()) {
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
    return logicToDisplay(t, limit);
  };
  const displayToLogicIndex = (dpos: number): number => {
    if (showingPlaceholder()) return 0;
    const t = text();
    if (obscure()) {
      let i = 0;
      let n = 0;
      while (i < t.length && n < dpos) {
        i = Graphemes.nextBoundary(t, i);
        n++;
      }
      return i;
    }
    return displayToLogic(t, dpos);
  };

  const placeholderColor = () => textDefaults.placeholder;
  const cursorColor = () => textDefaults.text;
  const cursorWidth = 2;
  const composingBackgroundColor = () => rgba(200, 200, 255, 50);
  const composingUnderlineColor = () => rgba(0, 0, 0, 140);

  const paragraph = memo(() => {
    const ft = displayText();
    if (ft.length === 0) return null;
    const isPh = showingPlaceholder();
    const span: RichTextSpan = {
      text: ft,
      style: {
        fontFamily: fontFamily(),
        fontSize: fontSize(),
        fontWeight: fontWeight(),
        italic: italic(),
        color: isPh ? placeholderColor() : color(),
        letterSpacing: letterSpacing(),
        wordSpacing: wordSpacing(),
        lineHeightMultiplier: lineHeightMultiplier(),
      },
    };
    return buildParagraph(
      [span],
      singleLine() ? Number.MAX_VALUE : innerSize(node, 'x'),
      maxLines(),
      '…',
      TextAlign.START
    );
  });

  // ---------- 输入法组合态 ----------
  const composingText = createSignal('');
  const composingCursorPos = createSignal(0);
  let compositionBase: [number, string] | null = null;
  const composingStart = () =>
    coerce(compositionBase?.[0] ?? cursor(), 0, text().length);
  const composingLength = () => composingText.get().length;

  // ---------- 撤销重做 ----------
  const undoRedo = new UndoRedo(maxHistorySize);
  const writeText = (newValue: string) => onTextChange?.(newValue);

  // ---------- 光标闪烁（仅聚焦时） ----------
  const cursorVisible = createSignal(true);
  let preferredX = NaN;
  const blink =
    typeof setInterval !== 'undefined'
      ? setInterval(() => {
          if (focusedSignal.get() === self) {
            cursorVisible.set(!cursorVisible.get());
          } else if (!cursorVisible.get()) {
            cursorVisible.set(true);
          }
        }, 530)
      : null;
  if (blink && typeof (blink as any).unref === 'function') {
    (blink as any).unref();
  }

  // ---------- 选择相关辅助 ----------
  const sel = (): Selectable2 => self as unknown as Selectable2;

  const selectable: Selectable2 = {
    selectionRect(): Rect2 | null {
      const range = selectionManager?.rangeOf(self) ?? null;
      if (!range || range[1] <= range[0]) return null;
      const p = paragraph();
      if (!p) return null;
      const rects = p.getRectsForRange(
        logicToDisplayIndex(range[0]),
        logicToDisplayIndex(range[1]),
        RectStyle.TIGHT
      );
      if (rects.length === 0) return null;
      const first = rects[0];
      const last = rects[rects.length - 1];
      const x = absoluteX(self) + self.paddingInlineStart();
      const y = absoluteY(self) + self.paddingBlockStart();
      return new RectF(
        x + Math.min(first.left, last.left),
        y + Math.min(first.top, last.top),
        x + Math.max(first.right, last.right),
        y + Math.max(first.bottom, last.bottom)
      );
    },
    textLength(): number {
      return text().length;
    },
    positionForPoint(globalX: number, globalY: number): number {
      const p = paragraph();
      if (!p) return 0;
      const off = p.getGlyphPositionAtCoordinate(
        globalX - absoluteX(self) - self.paddingInlineStart(),
        globalY - absoluteY(self) - self.paddingBlockStart()
      );
      return coerce(displayToLogicIndex(off), 0, text().length);
    },
    textInRange(start: number, end: number): string {
      const t = text();
      return end > start ? t.substring(start, Math.min(end, t.length)) : '';
    },
    wordRangeAt(offset: number): [number, number] | null {
      return Words.wordRangeAt(text(), offset);
    },
    paragraphRangeAt(offset: number): [number, number] | null {
      const t = text();
      if (t.length === 0) return null;
      const d = coerce(offset, 0, t.length);
      const start = d === 0 ? 0 : t.lastIndexOf('\n', d - 1) + 1;
      const nl = t.indexOf('\n', d);
      return [start, nl === -1 ? t.length : nl];
    },
  };

  // ---------- 编辑动作 ----------
  const insertText = (inserted: string) => {
    if (readOnly()) return;
    const t = singleLine()
      ? inserted.replace(/\n/g, '').replace(/\r/g, '')
      : inserted;
    if (t.length === 0) return;
    if (localHasSel()) {
      replaceSel(t);
      return;
    }
    insertAtCursor(t);
  };
  /** 无选区时按光标插入（与 replaceSel 的解耦点，避免两者相互递归） */
  const insertAtCursor = (t: string) => {
    const pos = cursor();
    undoRedo.push(new InsertTextAction(pos, t));
    writeText(text().slice(0, pos) + t + text().slice(pos));
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
      new ReplaceSelectionAction(s, text().substring(s, e), replacement)
    );
    writeText(text().slice(0, s) + replacement + text().slice(e));
    setCursor(s + replacement.length);
  };
  const delSel = () => {
    if (!localHasSel()) return;
    const s = localSelStart();
    const e = localSelEnd();
    undoRedo.push(new DeleteTextAction(s, text().substring(s, e), true));
    writeText(text().slice(0, s) + text().slice(e));
    setCursor(s);
  };
  const backspace = () => {
    if (localHasSel()) return delSel();
    const pos = cursor();
    if (pos <= 0) return;
    const start = Graphemes.prevBoundary(text(), pos);
    if (start >= pos) return;
    undoRedo.push(
      new DeleteTextAction(start, text().substring(start, pos), true)
    );
    writeText(text().slice(0, start) + text().slice(pos));
    setCursor(start);
  };
  const deleteForward = () => {
    if (localHasSel()) return delSel();
    const pos = cursor();
    if (pos >= text().length) return;
    const end = Graphemes.nextBoundary(text(), pos);
    if (end <= pos) return;
    undoRedo.push(new DeleteTextAction(pos, text().substring(pos, end), false));
    writeText(text().slice(0, pos) + text().slice(end));
    setCursor(pos);
  };
  const deleteWordBackward = () => {
    if (localHasSel()) return delSel();
    const pos = cursor();
    if (pos <= 0) return;
    const start = Words.prevBoundary(text(), pos);
    if (start >= pos) return;
    undoRedo.push(
      new DeleteTextAction(start, text().substring(start, pos), true)
    );
    writeText(text().slice(0, start) + text().slice(pos));
    setCursor(start);
    preferredX = NaN;
  };
  const deleteWordForward = () => {
    if (localHasSel()) return delSel();
    const pos = cursor();
    if (pos >= text().length) return;
    const end = Words.nextBoundary(text(), pos);
    if (end <= pos) return;
    undoRedo.push(new DeleteTextAction(pos, text().substring(pos, end), false));
    writeText(text().slice(0, pos) + text().slice(end));
    setCursor(pos);
    preferredX = NaN;
  };

  // ---------- 行 / 文档 / 词 / 页 导航 ----------
  const lineRangeAt = (pos: number): [number, number] | null => {
    const p = paragraph();
    if (!p) return null;
    if (text().length === 0) return null;
    const dispPos = logicToDisplayIndex(pos);
    const lines = p.getLineMetrics();
    const m =
      lines.find(l => dispPos >= l.start && dispPos < l.end) ??
      (pos === text().length ? lines[lines.length - 1] : null);
    if (!m) return null;
    let displayEnd = Math.min(m.end, displayText().length);
    if (displayEnd > m.start && displayText().charAt(displayEnd - 1) === '\n') {
      displayEnd--;
    }
    if (displayEnd > m.start && displayText().charAt(displayEnd - 1) === '\r') {
      displayEnd--;
    }
    return [displayToLogicIndex(m.start), displayToLogicIndex(displayEnd)];
  };
  const lineStart = (pos: number) => lineRangeAt(pos)?.[0] ?? 0;
  const lineEnd = (pos: number) => lineRangeAt(pos)?.[1] ?? text().length;
  const moveLeft = () => {
    const p = cursor();
    if (p > 0) setCursor(Graphemes.prevBoundary(text(), p));
  };
  const moveRight = () => {
    const p = cursor();
    if (p < text().length) setCursor(Graphemes.nextBoundary(text(), p));
  };
  const movePrevWord = () => setCursor(Words.prevBoundary(text(), cursor()));
  const moveNextWord = () => setCursor(Words.nextBoundary(text(), cursor()));
  /**
   * 光标矩形 + 光标所在的插入点横坐标。
   * - 优先取光标后一个字符的矩形（它的 left 就是插入点）；
   * - 文末取不到时退回前一个字符的矩形（插入点在其 right）。
   * preferredX 用插入点而不是字符矩形中心：中心正好落在两个字符之间的
   * 临界点上，CanvasKit 的取整方向会让列位置左右抖动。
   */
  const caretMetrics = (): { rect: CaretRect; x: number } | null => {
    const p = paragraph();
    if (!p) return null;
    const dpos = logicToDisplayIndex(focusIndex());
    const at = p.getRectsForRange(dpos, dpos + 1, RectStyle.TIGHT)[0];
    if (at) return { rect: at, x: at.left };
    if (dpos > 0) {
      const prev = p.getRectsForRange(dpos - 1, dpos, RectStyle.TIGHT)[0];
      if (prev) return { rect: prev, x: prev.right };
    }
    return null;
  };
  /**
   * 光标所在软行的行索引：拿光标矩形的竖直中心去命中行盒（top/bottom）。
   * 不能拿光标矩形高度当行距——TIGHT 矩形高度由字形度量决定，与行高
   * （lineHeightMultiplier）无关；两者不相等时按"矩形高度"走一步会落到
   * 隔壁的隔壁行，表现就是上下键一次跳两行（旧版 canvasRender 用行索引解决）。
   */
  const caretLineIndex = (r: { top: number; bottom: number }): number => {
    const p = paragraph();
    if (!p) return -1;
    const lines = p.getLineMetrics();
    if (lines.length === 0) return -1;
    const cy = r.top + (r.bottom - r.top) / 2;
    let nearest = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (cy >= l.top && cy < l.bottom) return i;
      const d = cy < l.top ? l.top - cy : cy - l.bottom;
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }
    return nearest;
  };
  /** 跳到第 [index] 条软行：取行盒中心高度 + preferredX 求字素位置 */
  const moveToLine = (index: number, extend: boolean) => {
    const p = paragraph();
    if (!p) return;
    const lines = p.getLineMetrics();
    if (lines.length === 0) return;
    const line = lines[coerce(index, 0, lines.length - 1)];
    if (!line) return;
    const y = (line.top + line.bottom) / 2;
    moveTo(
      displayToLogicIndex(p.getGlyphPositionAtCoordinate(preferredX, y)),
      extend
    );
  };
  /** 上下移动一行（[dir] -1 上 / 1 下），保持 preferredX 视觉列 */
  const verticalMove = (dir: 1 | -1, extend = false) => {
    const m = caretMetrics();
    if (!m) return moveTo(dir < 0 ? 0 : text().length, extend);
    if (Number.isNaN(preferredX)) preferredX = m.x;
    const lines = paragraph()?.getLineMetrics() ?? [];
    if (lines.length <= 1) return;
    const i = caretLineIndex(m.rect);
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
    if (f > 0) caretPair.set([a, Graphemes.prevBoundary(text(), f)]);
  };
  const selectRight = () => {
    const a = selAnchor();
    const f = focusIndex();
    if (f < text().length)
      caretPair.set([a, Graphemes.nextBoundary(text(), f)]);
  };
  const selectUp = () => verticalMove(-1, true);
  const selectDown = () => verticalMove(1, true);
  const pageLines = 12;
  const jumpLines = (count: number, extend: boolean) => {
    const m = caretMetrics();
    if (!m) return moveTo(count < 0 ? 0 : text().length, extend);
    if (Number.isNaN(preferredX)) preferredX = m.x;
    const lines = paragraph()?.getLineMetrics() ?? [];
    if (lines.length === 0) return;
    const i = caretLineIndex(m.rect);
    if (i < 0) return;
    const j = coerce(i + count, 0, lines.length - 1);
    if (j === i) return;
    moveToLine(j, extend);
  };

  const caretRect = (): CaretRect[] => {
    const p = paragraph();
    if (!p) return [];
    const dpos = logicToDisplayIndex(focusIndex());
    const list = p.getRectsForRange(dpos, dpos + 1, RectStyle.TIGHT);
    if (list.length) return list;
    if (dpos > 0) return p.getRectsForRange(dpos - 1, dpos, RectStyle.TIGHT);
    return [];
  };

  const computeScrollX = (): number => {
    if (!singleLine()) return 0;
    const p = paragraph();
    if (!p) return 0;
    const box = Math.max(
      1,
      innerSize(node, 'x') - self.paddingInlineStart() - self.paddingInlineEnd()
    );
    const caret = caretRect()[0];
    const left = caret?.left ?? 0;
    const right = caret?.right ?? left;
    let off = right > box ? right - box : 0;
    if (left - off < 0) off = left;
    return coerce(off, 0, Math.max(0, p.width() - box));
  };

  /**
   * 光标矩形（节点本地坐标，已含 padding 与单行水平滚动偏移）。
   * 供绘制光标与定位原生输入控件（让输入法候选框跟随光标）共用。
   */
  const caretLocalRect = (): {
    x: number;
    y: number;
    w: number;
    h: number;
  } | null => {
    const r = caretRect()[0];
    if (!r) return null;
    return {
      x: r.left + self.paddingInlineStart() - computeScrollX(),
      y: r.top + self.paddingBlockStart(),
      w: Math.max(cursorWidth, r.right - r.left),
      h: Math.max(fontSize(), r.bottom - r.top),
    };
  };

  // ---------- 撤销 / 重做 ----------
  const applyState = (s: TextState) => {
    writeText(s.text);
    setCursor(s.cursor);
  };
  const undo = () => {
    if (composingText.get().length > 0) return;
    const s = undoRedo.undo(new TextState(text(), cursor()));
    if (s) applyState(s);
  };
  const redo = () => {
    if (composingText.get().length > 0) return;
    const s = undoRedo.redo(new TextState(text(), cursor()));
    if (s) applyState(s);
  };

  // ---------- 选择吸收 / 公开方法 ----------
  const absorbGlobalSelection = () => {
    if (anchorIndex() >= 0 && focusIndex() >= 0) return;
    const r = selectionManager?.rangeOf(self);
    if (r) caretPair.set([r[0], r[1]]);
  };
  /**
   * 提交组合串：清掉组合态但保留已上屏文本（compositionend / 空串上报）。
   * 与 [endComposition] 的区别：后者会把窗口文本回退掉。
   */
  const commitComposition = () => {
    const start = compositionBase?.[0];
    const winLen = composingLength();
    compositionBase = null;
    composingText.set('');
    composingCursorPos.set(0);
    preferredX = NaN;
    if (start != null) setCursor(coerce(start + winLen, 0, text().length));
  };

  const endComposition = (restore: boolean) => {
    const base = compositionBase;
    const winLen = composingLength();
    compositionBase = null;
    composingText.set('');
    composingCursorPos.set(0);
    preferredX = NaN;
    if (base == null && winLen === 0) return;
    const start = base?.[0] ?? coerce(cursor(), 0, text().length);
    const restored = restore ? (base?.[1] ?? '') : '';
    const cur = text();
    if (start <= cur.length) {
      const newText =
        cur.substring(0, start) +
        restored +
        cur.substring(Math.min(start + winLen, cur.length));
      if (newText !== cur) writeText(newText);
    }
    setCursor(start);
  };

  const editorHandle: EditableTextHandle = {
    cursorSelPair(): SelPair2 | null {
      if (activeEditorSignal.get() !== self) return null;
      const a = anchorIndex();
      const f = focusIndex();
      if (a < 0 || f < 0) return null;
      const len = text().length;
      return {
        anchor: {
          node: self as unknown as Selectable2,
          offset: coerce(a, 0, len),
        },
        focus: {
          node: self as unknown as Selectable2,
          offset: coerce(f, 0, len),
        },
      };
    },
    hasSelection(): boolean {
      const r = selectionManager?.rangeOf(self) ?? null;
      return r ? r[1] > r[0] : false;
    },
    cut(): void {
      absorbGlobalSelection();
      if (!localHasSel()) return;
      clipboardSetText(text().substring(localSelStart(), localSelEnd()));
      delSel();
    },
    copy(): void {
      absorbGlobalSelection();
      if (!localHasSel()) return;
      clipboardSetText(text().substring(localSelStart(), localSelEnd()));
    },
    paste(): void {
      const t = clipboardGetText();
      if (!t) return;
      preferredX = NaN;
      endComposition(false);
      insertText(t);
    },
    selectAll(): void {
      caretPair.set([0, text().length]);
    },
    collapseExternalSelection(): void {
      if (anchorIndex() >= 0 && focusIndex() !== anchorIndex()) {
        caretPair.set([anchorIndex(), anchorIndex()]);
      }
    },
    onComposing(t: string, cursorPosition: number): void {
      if (t.length === 0) {
        commitComposition();
        return;
      }
      absorbGlobalSelection();
      const cur = text();
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
    commitComposingText(finalText: string): void {
      if (finalText.length > 0) {
        editorHandle.onComposing(finalText, finalText.length);
      }
      commitComposition();
    },
    inputOverlay(): InputOverlayRect | null {
      const r = caretLocalRect();
      return {
        x: absoluteX(self) + (r ? r.x : self.paddingInlineStart()),
        y: absoluteY(self) + (r ? r.y : self.paddingBlockStart()),
        w: r ? r.w : 1,
        h: r ? r.h : fontSize(),
        fontSize: fontSize(),
      };
    },
    handleKey(e: KeyEvent2): boolean {
      if (readOnly()) return false;
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
          if (e.ctrl && e.shift)
            caretPair.set([
              selAnchor(),
              Words.prevBoundary(text(), focusIndex()),
            ]);
          else if (e.ctrl) movePrevWord();
          else if (e.shift) selectLeft();
          else moveLeft();
          preferredX = NaN;
          return true;
        case KeyCode2.Right:
          if (e.ctrl && e.shift)
            caretPair.set([
              selAnchor(),
              Words.nextBoundary(text(), focusIndex()),
            ]);
          else if (e.ctrl) moveNextWord();
          else if (e.shift) selectRight();
          else moveRight();
          preferredX = NaN;
          return true;
        case KeyCode2.Home:
          if (e.ctrl && e.shift) extendTo(0);
          else if (e.ctrl) setCursor(0);
          else if (e.shift) extendTo(lineStart(focusIndex()));
          else setCursor(lineStart(focusIndex()));
          preferredX = NaN;
          return true;
        case KeyCode2.End:
          if (e.ctrl && e.shift) extendTo(text().length);
          else if (e.ctrl) setCursor(text().length);
          else if (e.shift) extendTo(lineEnd(focusIndex()));
          else setCursor(lineEnd(focusIndex()));
          preferredX = NaN;
          return true;
        case KeyCode2.PageUp:
          jumpLines(-pageLines, e.shift);
          return true;
        case KeyCode2.PageDown:
          jumpLines(pageLines, e.shift);
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
          if (singleLine()) onSubmit?.();
          else if (e.ctrl || e.meta) onSubmit?.();
          else insertText('\n');
          preferredX = NaN;
          return true;
        case KeyCode2.Tab:
          if (!singleLine()) {
            insertText('\t');
            return true;
          }
          return false;
        default: {
          if (e.ctrl || e.alt) return false;
          // 组合态下键盘由输入法独占（此时 key 多为 'Process'），不再按可打印字符插入
          if (composingText.get().length > 0) return false;
          // 只认单字符：'Shift' / 'CapsLock' / 'F5' / 'Process' 等键名一律不录入
          // （旧版 canvasRender 同口径：e.key.length == 1 ? charCodeAt(0) : 0）
          const code = e.key.length === 1 ? e.key.charCodeAt(0) : 0;
          if (code < 0x20 || code === 0x7f) return false;
          preferredX = NaN;
          endComposition(false);
          insertText(e.key);
          return true;
        }
      }
    },
    asSelectable(): Selectable2 {
      return self as unknown as Selectable2;
    },
  };

  // 鼠标按下：落点定位光标并塌缩
  self.mouseDown = (event: MouseEvent2) => {
    preferredX = NaN;
    const r = selectionManager?.rangeOf(self);
    if (r && r[1] > r[0]) return; // 已有分配选区时由拖拽接管，不抢光标
    setCursor(selectable.positionForPoint(event.globalX, event.globalY));
  };

  Object.assign(self, selectable, editorHandle);

  node2.create({
    ...rest,
    draw(ctx2: CanvasRenderingContext2D) {
      const p = paragraph();
      const padX = self.paddingInlineStart();
      const padY = self.paddingBlockStart();
      const scrollX = computeScrollX();
      ctx2.save();
      ctx2.translate(-scrollX, 0);
      if (p) {
        drawParagraph(p.paragraph, ctx2, padX, padY);
        const range = selectionManager?.rangeOf(self) ?? null;
        if (range && range[1] > range[0]) {
          ctx2.fillStyle = colorToCSS(selectionColor());
          for (const r of p.getRectsForRange(
            logicToDisplayIndex(range[0]),
            logicToDisplayIndex(range[1]),
            RectStyle.TIGHT
          )) {
            ctx2.fillRect(
              r.left + padX,
              r.top + padY,
              r.right - r.left,
              r.bottom - r.top
            );
          }
        }
      }
      const focused = focusedSignal.get() === self;
      const range2 = selectionManager?.rangeOf(self) ?? null;
      if (!range2 && focused && cursorVisible.get()) {
        const dpos = logicToDisplayIndex(cursor());
        const cp = paragraph();
        if (cp) {
          let r: {
            left: number;
            top: number;
            right: number;
            bottom: number;
          } | null = null;
          const rects = cp.getRectsForRange(dpos, dpos + 1, RectStyle.TIGHT);
          if (rects.length) r = rects[0];
          else if (dpos > 0) {
            const r2 = cp.getRectsForRange(dpos - 1, dpos, RectStyle.TIGHT);
            if (r2.length)
              r = {
                left: r2[0].right - cursorWidth,
                top: r2[0].top,
                right: r2[0].right,
                bottom: r2[0].bottom,
              };
          }
          if (r) {
            ctx2.fillStyle = colorToCSS(cursorColor());
            ctx2.fillRect(
              r.left + padX,
              r.top + padY,
              cursorWidth,
              r.bottom - r.top
            );
          }
        }
      }
      if (composingText.get().length > 0) {
        const cp = paragraph();
        if (cp) {
          const s = logicToDisplayIndex(composingStart());
          const e = logicToDisplayIndex(
            composingStart() + composingText.get().length
          );
          for (const r of cp.getRectsForRange(s, e, RectStyle.TIGHT)) {
            ctx2.fillStyle = colorToCSS(composingBackgroundColor());
            ctx2.fillRect(
              r.left + padX,
              r.top + padY,
              r.right - r.left,
              r.bottom - r.top
            );
            ctx2.fillStyle = colorToCSS(composingUnderlineColor());
            ctx2.fillRect(
              r.left + padX,
              Math.max(r.top, r.bottom - 2) + padY,
              r.right - r.left,
              2
            );
          }
        }
      }
      ctx2.restore();
    },
    size(d: 'x' | 'y'): LayoutSize {
      const p = paragraph();
      if (d === 'x') {
        const w =
          typeof rest.width === 'function'
            ? (rest.width as GetValue<number>)()
            : rest.width;
        if (typeof w === 'number') return layoutSize(w, false);
        return layoutSize(p ? p.width() : 0, true);
      }
      const h =
        typeof rest.height === 'function'
          ? (rest.height as GetValue<number>)()
          : rest.height;
      if (typeof h === 'number') return layoutSize(h, false);
      return layoutSize(p ? p.height() : fontSize() * 1.4, true);
    },
  })(node)(ctx);
});
