import { createSignal, valueOrGetToGet } from 'wy-helper';
import { StateHolder } from 'mve-core';
import { absolutePosition, Node } from './Node';
import { MouseEvent } from './MouseEvent';
import { ColorInt, colorToCSS, rgba } from './Draw';
import {
  EngineGlobal,
  engineGlobalContext,
  KeyCode,
  KeyEvent,
} from './EngineGlobal';
import { WrappedTextNode, WrappedTextNodeArg } from './WrappedTextNode';
import { RectStyle, TextRect } from './PlatformParagraph';
import { clipboardGetText, clipboardSetText } from './Clipboard';
import { insert, removeRange } from './util';
import {
  DeleteTextAction,
  InsertTextAction,
  ReplaceSelectionAction,
  TextState,
  UndoRedo,
} from './UndoRedo';
import * as Graphemes from './Graphemes';
import * as Words from './Words';

let activeEditor: EditableTextNode | null = null;
let keyRouterRegistered = false;

export function getActiveEditor(): EditableTextNode | null {
  return activeEditor;
}

export interface EditableTextNodeArg<
  T = EditableTextNode,
> extends WrappedTextNodeArg<T> {
  maxHistorySize?: number;
  cursorColor?: ColorInt;
  cursorWidth?: number;
  setText?(v: string): string;
  composingBackgroundColor?: ColorInt;
  composingUnderlineColor?: ColorInt;
}

export class EditableTextNode extends WrappedTextNode {
  private readonly textSignal = createSignal('');
  private readonly cursorVisible = createSignal(true);

  private readonly composingStart = createSignal(0);
  private readonly composingLength = createSignal(0);
  private compositionBase: [number, string] | null = null;
  private readonly composingText = createSignal('');
  private readonly composingCursorPos = createSignal(0);

  private readonly undoRedo: UndoRedo;
  private readonly g: EngineGlobal;

  private preferredX = NaN;
  private lastOverlayX = NaN;
  private lastOverlayY = NaN;

  text(): string {
    return this.textSignal.get();
  }
  setText(v: string): void {
    this.textSignal.set(v);
  }

  focusable(): boolean {
    return true;
  }

  cursorColor(): ColorInt {
    return rgba(0, 0, 0);
  }
  cursorWidth(): number {
    return 2;
  }
  composingBackgroundColor(): ColorInt {
    return rgba(200, 200, 255, 50);
  }
  composingUnderlineColor(): ColorInt {
    return rgba(0, 0, 0, 140);
  }

  constructor(
    context: StateHolder<Node, readonly Node[]>,
    args: EditableTextNodeArg = {}
  ) {
    super(context, args as WrappedTextNodeArg);
    this.setText = args.setText || this.setText;
    this.undoRedo = new UndoRedo(args.maxHistorySize ?? 100);
    this.cursorColor = valueOrGetToGet(args.cursorColor, this.cursorColor);
    this.cursorWidth = valueOrGetToGet(args.cursorWidth, this.cursorWidth);
    this.composingBackgroundColor = valueOrGetToGet(
      args.composingBackgroundColor,
      this.composingBackgroundColor
    );
    this.composingUnderlineColor = valueOrGetToGet(
      args.composingUnderlineColor,
      this.composingUnderlineColor
    );

    this.g = context.consume(engineGlobalContext)!;
    if (!keyRouterRegistered) {
      keyRouterRegistered = true;
      this.g.registerKeyPress(e => {
        const ed = this.g.focused();
        if (ed instanceof EditableTextNode) {
          ed.handleKey(e);
        }
      });
      this.g.registerComposingText((t, p) => {
        const ed = this.g.focused();
        if (ed instanceof EditableTextNode) {
          ed.composingText.set(t);
          ed.composingCursorPos.set(p);
          if (t.length == 0) {
            ed.cancelComposition();
            return;
          }
          ed.onComposing('', t, p);
        }
      });
    }
    context.addDestroy(() => {
      this.hideOverlay();
    });
  }

  canUndo(): boolean {
    return this.undoRedo.canUndo();
  }
  canRedo(): boolean {
    return this.undoRedo.canRedo();
  }

  undo(): void {
    if (this.inComposing()) return;
    const current = new TextState(this.text(), this.cursor());
    const next = this.undoRedo.undo(current);
    if (next) this.applyState(next);
  }

  redo(): void {
    if (this.inComposing()) return;
    const current = new TextState(this.text(), this.cursor());
    const next = this.undoRedo.redo(current);
    if (next) this.applyState(next);
  }

  insertText(inserted: string): void {
    if (this.hasSel()) {
      this.replaceSel(inserted);
      return;
    }
    const pos = this.cursor();
    this.undoRedo.push(new InsertTextAction(pos, inserted));
    this.setText(insert(this.text(), pos, inserted));
    this.setCursor(pos + inserted.length);
  }

  backspace(): void {
    if (this.hasSel()) {
      this.delSel();
      return;
    }
    const pos = this.cursor();
    if (pos <= 0) return;
    const start = Graphemes.prevBoundary(this.text(), pos);
    if (start >= pos) return;
    const deleted = this.text().substring(start, pos);
    this.undoRedo.push(new DeleteTextAction(start, deleted, true));
    this.setText(removeRange(this.text(), start, pos));
    this.setCursor(start);
  }

  delete(): void {
    if (this.hasSel()) {
      this.delSel();
      return;
    }
    const pos = this.cursor();
    if (pos >= this.text().length) return;
    const end = Graphemes.nextBoundary(this.text(), pos);
    if (end <= pos) return;
    const deleted = this.text().substring(pos, end);
    this.undoRedo.push(new DeleteTextAction(pos, deleted, false));
    this.setText(removeRange(this.text(), pos, end));
    this.setCursor(pos);
  }

  moveLeft(): void {
    const p = this.cursor();
    if (p > 0) this.setCursor(Graphemes.prevBoundary(this.text(), p));
  }

  moveRight(): void {
    const p = this.cursor();
    if (p < this.text().length) this.setCursor(Graphemes.nextBoundary(this.text(), p));
  }

  moveHome(): void {
    this.preferredX = NaN;
    this.setCursor(this.lineStart(this.cursor()));
  }

  moveEnd(): void {
    this.preferredX = NaN;
    this.setCursor(this.lineEnd(this.cursor()));
  }

  selectHome(): void {
    this.preferredX = NaN;
    this.extendTo(this.lineStart(this.focusIndex.get()));
  }

  selectEnd(): void {
    this.preferredX = NaN;
    this.extendTo(this.lineEnd(this.focusIndex.get()));
  }

  moveDocStart(): void {
    this.preferredX = NaN;
    this.setCursor(0);
  }

  moveDocEnd(): void {
    this.preferredX = NaN;
    this.setCursor(this.text().length);
  }

  selectDocStart(): void {
    this.preferredX = NaN;
    this.extendTo(0);
  }

  selectDocEnd(): void {
    this.preferredX = NaN;
    this.extendTo(this.text().length);
  }

  selectAll(): void {
    this.selectRange(0, this.text().length);
  }

  selectLeft(): void {
    const a =
      this.anchorIndex.get() >= 0 ? this.anchorIndex.get() : this.cursor();
    const f = Math.min(Math.max(this.focusIndex.get(), 0), this.text().length);
    if (f > 0) {
      this.anchorIndex.set(a);
      this.focusIndex.set(Graphemes.prevBoundary(this.text(), f));
    }
  }

  selectRight(): void {
    const a =
      this.anchorIndex.get() >= 0 ? this.anchorIndex.get() : this.cursor();
    const f = Math.min(Math.max(this.focusIndex.get(), 0), this.text().length);
    if (f < this.text().length) {
      this.anchorIndex.set(a);
      this.focusIndex.set(Graphemes.nextBoundary(this.text(), f));
    }
  }

  movePrevWord(): void {
    this.preferredX = NaN;
    this.setCursor(
      Words.prevBoundary(this.text(), this.cursor())
    );
  }

  moveNextWord(): void {
    this.preferredX = NaN;
    this.setCursor(
      Words.nextBoundary(this.text(), this.cursor())
    );
  }

  selectPrevWord(): void {
    this.preferredX = NaN;
    this.extendTo(
      Words.prevBoundary(
        this.text(),
        Math.min(Math.max(this.focusIndex.get(), 0), this.text().length)
      )
    );
  }

  selectNextWord(): void {
    this.preferredX = NaN;
    this.extendTo(
      Words.nextBoundary(
        this.text(),
        Math.min(Math.max(this.focusIndex.get(), 0), this.text().length)
      )
    );
  }

  deleteWordBackward(): void {
    if (this.hasSel()) {
      this.delSel();
      return;
    }
    const pos = this.cursor();
    if (pos <= 0) return;
    const start = Words.prevBoundary(this.text(), pos);
    if (start >= pos) return;
    this.undoRedo.push(
      new DeleteTextAction(start, this.text().substring(start, pos), true)
    );
    this.setText(removeRange(this.text(), start, pos));
    this.setCursor(start);
    this.preferredX = NaN;
  }

  deleteWordForward(): void {
    if (this.hasSel()) {
      this.delSel();
      return;
    }
    const pos = this.cursor();
    if (pos >= this.text().length) return;
    const end = Words.nextBoundary(this.text(), pos);
    if (end <= pos) return;
    this.undoRedo.push(
      new DeleteTextAction(pos, this.text().substring(pos, end), false)
    );
    this.setText(removeRange(this.text(), pos, end));
    this.setCursor(pos);
    this.preferredX = NaN;
  }

  moveUp(): void {
    const newPos = this.verticalMove(-1);
    if (newPos != null) this.setCursor(newPos);
  }

  moveDown(): void {
    const newPos = this.verticalMove(1);
    if (newPos != null) this.setCursor(newPos);
  }

  selectUp(): void {
    const newPos = this.verticalMove(-1);
    if (newPos != null) this.extendTo(newPos);
  }

  selectDown(): void {
    const newPos = this.verticalMove(1);
    if (newPos != null) this.extendTo(newPos);
  }

  movePageUp(): void {
    this.jumpLines(-this.pageLines());
  }

  movePageDown(): void {
    this.jumpLines(this.pageLines());
  }

  selectPageUp(): void {
    this.jumpLines(-this.pageLines(), true);
  }

  selectPageDown(): void {
    this.jumpLines(this.pageLines(), true);
  }

  /** PageUp/PageDown 一次跳动的行数。 */
  private pageLines(): number {
    return 12;
  }

  /**
   * 垂直跳 [count] 行（负上正下），保持 preferredX 视觉列；
   * [extend] 时保持锚点只移动焦点。
   */
  private jumpLines(count: number, extend = false): void {
    const p = this.paragraph();
    if (!p) return;
    const rects = this.cursorRect();
    if (rects.length == 0) {
      if (!extend) this.setCursor(count < 0 ? 0 : this.text().length);
      return;
    }
    const r = rects[0];
    if (isNaN(this.preferredX))
      this.preferredX = r.left + (r.right - r.left) / 2;

    const lines = p.getLineMetrics();
    if (lines.length <= 1) return;

    const cy = r.top + (r.bottom - r.top) / 2;
    let i = 0;
    for (; i < lines.length; i++) {
      if (cy >= lines[i].top && cy < lines[i].bottom) break;
    }
    if (i >= lines.length) return;
    const j = Math.min(Math.max(i + count, 0), lines.length - 1);
    if (j == i) return;

    const target = lines[j];
    const y = (target.top + target.bottom) / 2;
    const newPos = p.getGlyphPositionAtCoordinate(this.preferredX, y);
    const clamped = Math.min(Math.max(newPos, 0), this.text().length);
    if (extend) this.extendTo(clamped);
    else this.setCursor(clamped);
  }

  mouseDownCapture(e: MouseEvent): void {
    super.mouseDownCapture(e);
    this.preferredX = NaN;
    this.showOverlay();
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.updateFocusOverlay();
    super.draw(ctx);
    this.updateOverlayPosition();

    if (!this.hasSel() && this.cursorVisible.get() && this.isFocused()) {
      this.drawCursor(ctx, this.cursor());
    }

    if (this.composingLength.get() > 0) {
      this.drawComposing(ctx);
    }
  }

  cancelComposition(): void {
    const start = this.composingStart.get();
    const len = this.composingLength.get();
    const base = this.compositionBase;
    if (base && len > 0) {
      const restored =
        this.text().substring(0, start) +
        base[1] +
        this.text().substring(start + len);
      if (restored != this.text()) this.setText(restored);
      this.setCursor(Math.min(Math.max(base[0], 0), restored.length));
    }
    this.composingStart.set(0);
    this.composingLength.set(0);
    this.compositionBase = null;
    this.composingText.set('');
    this.composingCursorPos.set(0);
    this.preferredX = NaN;
  }

  commitComposition(): void {
    this.composingStart.set(0);
    this.composingLength.set(0);
    this.compositionBase = null;
    this.composingText.set('');
    this.composingCursorPos.set(0);
  }

  commitComposingText(committed: string): void {
    if (this.compositionBase == null) {
      this.insertText(committed);
      return;
    }
    this.onComposing(committed, '', 0);
  }

  protected onComposing(
    committed: string,
    composing: string,
    cursorInComposing: number
  ): void {
    if (committed.length == 0 && composing.length == 0) {
      this.cancelComposition();
      return;
    }
    if (this.compositionBase == null) {
      const [start, oldLen] = this.hasSel()
        ? [this.selStart(), this.selEnd() - this.selStart()]
        : [Math.min(Math.max(this.cursor(), 0), this.text().length), 0];
      this.compositionBase = [
        start,
        this.text().substring(start, start + oldLen),
      ];
      this.composingStart.set(start);
    }
    const inserted = committed + composing;
    const start = this.composingStart.get();
    const oldLen = this.composingLength.get();
    if (inserted.length > 0 || oldLen > 0) {
      const newText =
        this.text().substring(0, start) +
        inserted +
        this.text().substring(start + oldLen);
      if (newText != this.text()) this.setText(newText);
    }
    this.composingStart.set(start + committed.length);
    this.composingLength.set(composing.length);
    const caret =
      this.composingStart.get() +
      Math.min(Math.max(cursorInComposing, 0), composing.length);
    this.anchorIndex.set(caret);
    this.focusIndex.set(caret);
    this.preferredX = NaN;
    if (composing.length == 0) {
      this.commitComposition();
    }
  }

  private replaceSel(replacement: string): void {
    const s = this.selStart();
    const e = this.selEnd();
    if (s == e) {
      this.insertText(replacement);
      return;
    }
    const orig = this.text().substring(s, e);
    this.undoRedo.push(new ReplaceSelectionAction(s, orig, replacement));
    this.setText(
      this.text().substring(0, s) + replacement + this.text().substring(e)
    );
    this.setCursor(s + replacement.length);
  }

  private delSel(): void {
    if (!this.hasSel()) return;
    const s = this.selStart();
    const e = this.selEnd();
    const deleted = this.text().substring(s, e);
    this.undoRedo.push(new DeleteTextAction(s, deleted, true));
    this.setText(removeRange(this.text(), s, e));
    this.setCursor(s);
  }

  private applyState(state: TextState): void {
    this.setText(state.text);
    this.setCursor(state.cursor);
  }

  private handleKey(e: KeyEvent): void {
    // 快捷键匹配对大小写归一：CapsLock 开启或 Shift 参与时平台上报大写（'Z'/'Y'）
    const key = e.key.toLowerCase();
    const alt = e.alt;
    if (e.ctrl && !e.shift && key == 'z') {
      this.undo();
      return;
    }
    if ((e.ctrl && key == 'y') || (e.ctrl && e.shift && key == 'z')) {
      this.redo();
      return;
    }
    if (e.ctrl && key == 'a') {
      this.selectAll();
      return;
    }
    if (e.ctrl && key == 'c') {
      this.copy();
      return;
    }
    if (e.ctrl && key == 'v') {
      void this.paste();
      return;
    }
    if (e.ctrl && key == 'x') {
      this.cut();
      return;
    }
    if (e.code == KeyCode.Backspace) {
      if (e.ctrl || alt) this.deleteWordBackward();
      else this.backspace();
      this.preferredX = NaN;
      return;
    }
    if (e.code == KeyCode.Delete) {
      if (e.ctrl || alt) this.deleteWordForward();
      else this.delete();
      this.preferredX = NaN;
      return;
    }
    if (e.code == KeyCode.Left) {
      if (e.ctrl && e.shift) this.selectPrevWord();
      else if (e.ctrl) this.movePrevWord();
      else if (e.shift) this.selectLeft();
      else this.moveLeft();
      this.preferredX = NaN;
      return;
    }
    if (e.code == KeyCode.Right) {
      if (e.ctrl && e.shift) this.selectNextWord();
      else if (e.ctrl) this.moveNextWord();
      else if (e.shift) this.selectRight();
      else this.moveRight();
      this.preferredX = NaN;
      return;
    }
    if (e.code == KeyCode.Up) {
      if (e.shift) this.selectUp();
      else this.moveUp();
      return;
    }
    if (e.code == KeyCode.Down) {
      if (e.shift) this.selectDown();
      else this.moveDown();
      return;
    }
    if (e.code == KeyCode.PageUp) {
      if (e.shift) this.selectPageUp();
      else this.movePageUp();
      return;
    }
    if (e.code == KeyCode.PageDown) {
      if (e.shift) this.selectPageDown();
      else this.movePageDown();
      return;
    }
    if (e.code == KeyCode.Home) {
      if (e.ctrl && e.shift) this.selectDocStart();
      else if (e.ctrl) this.moveDocStart();
      else if (e.shift) this.selectHome();
      else this.moveHome();
      return;
    }
    if (e.code == KeyCode.End) {
      if (e.ctrl && e.shift) this.selectDocEnd();
      else if (e.ctrl) this.moveDocEnd();
      else if (e.shift) this.selectEnd();
      else this.moveEnd();
      return;
    }
    if (e.code == KeyCode.Enter) {
      this.insertText('\n');
      this.preferredX = NaN;
      return;
    }
    if (e.code == KeyCode.Tab) {
      this.insertText('\t');
      this.preferredX = NaN;
      return;
    }
    if (e.ctrl || alt) return;
    const ch = e.key.length == 1 ? e.key.charCodeAt(0) : 0;
    if (ch < 0x20 || ch == 0x7f) return;
    this.preferredX = NaN;
    this.composingText.set('');
    this.insertText(e.key);
  }

  private copy(): void {
    if (!this.hasSel()) return;
    void clipboardSetText(
      this.text().substring(this.selStart(), this.selEnd())
    );
  }

  private cut(): void {
    if (!this.hasSel()) return;
    void clipboardSetText(
      this.text().substring(this.selStart(), this.selEnd())
    );
    this.delSel();
  }

  private async paste(): Promise<void> {
    const t = await clipboardGetText();
    if (t == null || t.length == 0) return;
    this.preferredX = NaN;
    this.composingText.set('');
    this.insertText(t);
  }

  private selStart(): number {
    return Math.max(Math.min(this.anchorIndex.get(), this.focusIndex.get()), 0);
  }

  private selEnd(): number {
    return Math.min(
      Math.max(this.anchorIndex.get(), this.focusIndex.get()),
      this.text().length
    );
  }

  private hasSel(): boolean {
    return (
      this.anchorIndex.get() >= 0 &&
      this.focusIndex.get() >= 0 &&
      this.anchorIndex.get() != this.focusIndex.get()
    );
  }

  private cursor(): number {
    return this.anchorIndex.get() >= 0
      ? Math.min(Math.max(this.anchorIndex.get(), 0), this.text().length)
      : 0;
  }

  private setCursor(idx: number): void {
    const c = Math.min(Math.max(idx, 0), this.text().length);
    this.anchorIndex.set(c);
    this.focusIndex.set(c);
  }

  /** 扩选到 [newPos]：锚点保持（未初始化则取当前光标），焦点移动。 */
  private extendTo(newPos: number): void {
    const a =
      this.anchorIndex.get() >= 0 ? this.anchorIndex.get() : this.cursor();
    this.anchorIndex.set(a);
    this.focusIndex.set(Math.min(Math.max(newPos, 0), this.text().length));
  }

  private selectRange(start: number, end: number): void {
    this.anchorIndex.set(Math.min(Math.max(start, 0), this.text().length));
    this.focusIndex.set(Math.min(Math.max(end, 0), this.text().length));
  }

  private inComposing(): boolean {
    return this.composingLength.get() > 0;
  }

  private cursorRect(): TextRect[] {
    const p = this.paragraph();
    if (!p) return [];
    const pos = this.cursor();
    const list = p.getRectsForRange(pos, pos + 1, RectStyle.TIGHT);
    if (list.length > 0) return list;
    if (pos > 0) return p.getRectsForRange(pos - 1, pos, RectStyle.TIGHT);
    return [];
  }

  /** 光标所在软行区间 [start, end)，不含换行符；无布局时 null。
   *  pos == length 时落在最后一行（半开区间匹配不到行尾光标）。 */
  private lineRangeAt(pos: number): [number, number] | null {
    const p = this.paragraph();
    if (!p) return null;
    const t = this.text();
    if (t.length == 0) return null;
    const lines = p.getLineMetrics();
    if (lines.length == 0) return null;
    const clamped = Math.min(Math.max(pos, 0), t.length);
    const m =
      lines.find(l => clamped >= l.start && clamped < l.end) ??
      (clamped == t.length ? lines[lines.length - 1] : null);
    if (!m) return null;
    let end = m.end;
    if (end > m.start && t[end - 1] == '\n') end--;
    if (end > m.start && t[end - 1] == '\r') end--;
    return [m.start, end];
  }

  private lineStart(pos: number): number {
    return this.lineRangeAt(pos)?.[0] ?? 0;
  }

  private lineEnd(pos: number): number {
    return this.lineRangeAt(pos)?.[1] ?? this.text().length;
  }

  private verticalMove(dir: 1 | -1): number | null {
    const p = this.paragraph();
    if (!p) return null;
    const rects = this.cursorRect();
    if (rects.length == 0) return null;
    const r = rects[0];
    if (isNaN(this.preferredX))
      this.preferredX = r.left + (r.right - r.left) / 2;

    const lines = p.getLineMetrics();
    if (lines.length <= 1) return null;

    const cy = r.top + (r.bottom - r.top) / 2;
    let i = 0;
    for (; i < lines.length; i++) {
      if (cy >= lines[i].top && cy < lines[i].bottom) break;
    }
    if (i >= lines.length) return null;
    const j = i + dir;
    if (j < 0 || j >= lines.length) return null;

    const target = lines[j];
    const y = (target.top + target.bottom) / 2;
    const newPos = p.getGlyphPositionAtCoordinate(this.preferredX, y);
    return Math.min(Math.max(newPos, 0), this.text().length);
  }

  private overlayOrigin(): [number, number] {
    const pos = this.cursor();
    const p = this.paragraph();
    const ax = absolutePosition.call(this, 'x');
    const ay = absolutePosition.call(this, 'y');
    if (p) {
      const list = p.getRectsForRange(pos, pos + 1, RectStyle.TIGHT);
      if (list.length > 0) {
        return [ax + list[0].left, ay + list[0].top];
      }
      if (pos > 0) {
        const r = p.getRectsForRange(pos - 1, pos, RectStyle.TIGHT);
        if (r.length > 0) return [ax + r[0].right, ay + r[0].top];
      }
    }
    return [ax, ay];
  }

  private showOverlay(): void {
    const [ox, oy] = this.overlayOrigin();
    this.lastOverlayX = ox;
    this.lastOverlayY = oy;
    this.g.requestInputOverlay(ox, oy, 1, 1, this.fontSize());
  }

  private updateOverlayPosition(): void {
    if (!this.isFocused()) return;
    const [ox, oy] = this.overlayOrigin();
    if (ox != this.lastOverlayX || oy != this.lastOverlayY) {
      this.lastOverlayX = ox;
      this.lastOverlayY = oy;
      this.g.requestInputOverlay(ox, oy, 1, 1, this.fontSize());
    }
  }

  private hideOverlay(): void {
    if (activeEditor === this) {
      this.g.hideInputOverlay();
      activeEditor = null;
    }
  }

  private updateFocusOverlay(): void {
    if (this.isFocused()) {
      if (activeEditor !== this) {
        activeEditor = this;
        this.showOverlay();
      }
    } else if (activeEditor === this) {
      this.hideOverlay();
    }
  }

  private drawCursor(ctx: CanvasRenderingContext2D, pos: number): void {
    const p = this.paragraph();
    ctx.fillStyle = colorToCSS(this.cursorColor());
    if (!p) {
      ctx.fillRect(
        this.paddingInlineStart(),
        this.paddingBlockStart(),
        this.cursorWidth(),
        Math.max(this.fontSize() * 1.4, 8)
      );
      return;
    }
    const px = this.paddingInlineStart();
    const py = this.paddingBlockStart();
    const list = p.getRectsForRange(pos, pos + 1, RectStyle.TIGHT);
    if (list.length > 0) {
      const r = list[0];
      ctx.fillRect(
        r.left + px,
        r.top + py,
        this.cursorWidth(),
        r.bottom - r.top
      );
    } else if (pos > 0) {
      const list2 = p.getRectsForRange(pos - 1, pos, RectStyle.TIGHT);
      if (list2.length > 0) {
        const r = list2[0];
        ctx.fillRect(
          r.right - this.cursorWidth() + px,
          r.top + py,
          this.cursorWidth(),
          r.bottom - r.top
        );
      }
    }
  }

  private drawComposing(ctx: CanvasRenderingContext2D): void {
    if (this.composingLength.get() <= 0) return;
    const p = this.paragraph();
    if (!p) return;
    const px = this.paddingInlineStart();
    const py = this.paddingBlockStart();
    const s = this.composingStart.get();
    const e = s + this.composingLength.get();
    for (const rect of p.getRectsForRange(s, e, RectStyle.TIGHT)) {
      ctx.fillStyle = colorToCSS(this.composingBackgroundColor());
      ctx.fillRect(
        rect.left + px,
        rect.top + py,
        rect.right - rect.left,
        rect.bottom - rect.top
      );
      ctx.fillStyle = colorToCSS(this.composingUnderlineColor());
      ctx.fillRect(
        rect.left + px,
        rect.bottom - 2 + py,
        rect.right - rect.left,
        2
      );
    }
  }
}
