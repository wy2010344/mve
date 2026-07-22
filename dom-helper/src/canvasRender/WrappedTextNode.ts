import { createSignal, memo } from 'wy-helper';
import { StateHolder } from 'mve-core';
import { Direction, Node, absolutePosition } from './Node';
import { RectNode } from './RectNode';
import {
  LayoutFun,
  LayoutSize,
  LayoutNode,
  absoluteLayout,
  sizeFromParent,
} from './LayoutNode';
import { MouseEvent } from './MouseEvent';
import { ColorInt, rgba, colorToCSS } from './Draw';
import { engineGlobalContext } from './EngineGlobal';
import { measureText } from './PlatformCanvas';

export enum WordBreak {
  PHRASE = 'PHRASE',
  BREAK_WORD = 'BREAK_WORD',
  ANY_CHAR = 'ANY_CHAR',
}

interface TextLine {
  start: number;
  end: number;
}

function isSpace(ch: string): boolean {
  return ch === ' ' || ch === '\t';
}

function measureWidth(
  text: string,
  start: number,
  end: number,
  fontFamily: string | null,
  fontWeight: number,
  fontSize: number
): number {
  if (start >= end) return 0;
  return measureText(
    text.substring(start, end),
    fontFamily,
    fontWeight,
    fontSize
  );
}

function wrapSegment(
  text: string,
  segStart: number,
  segEnd: number,
  maxW: number,
  wordBreak: WordBreak,
  fontFamily: string | null,
  fontWeight: number,
  fontSize: number,
  out: TextLine[]
): void {
  if (maxW >= Number.MAX_VALUE) {
    out.push({ start: segStart, end: segEnd });
    return;
  }

  const breaks: number[] = [];
  for (let i = segStart + 1; i < segEnd; i++) {
    const ch = text[i - 1];
    if (ch === ' ' || ch === '\n' || ch === '\t') {
      breaks.push(i);
    }
  }

  let lineStart = segStart;
  while (lineStart < segEnd) {
    while (lineStart < segEnd && isSpace(text[lineStart])) lineStart++;
    if (lineStart >= segEnd) break;

    if (wordBreak === WordBreak.ANY_CHAR) {
      let cx = 0;
      let ci = lineStart;
      while (ci < segEnd) {
        const cw = measureText(
          text[ci].toString(),
          fontFamily,
          fontWeight,
          fontSize
        );
        if (cx + cw > maxW && ci > lineStart) break;
        cx += cw;
        ci++;
      }
      out.push({ start: lineStart, end: ci });
      lineStart = ci;
      continue;
    }

    let lastFitIdx: number | null = null;
    for (let i = breaks.length - 1; i >= 0; i--) {
      const bp = breaks[i];
      if (
        bp > lineStart &&
        measureWidth(text, lineStart, bp, fontFamily, fontWeight, fontSize) <=
          maxW
      ) {
        lastFitIdx = bp;
        break;
      }
    }

    let lineEnd: number;
    if (lastFitIdx !== null) {
      lineEnd = lastFitIdx;
    } else if (wordBreak === WordBreak.PHRASE) {
      const nextSpace = text.indexOf(' ', lineStart);
      lineEnd =
        nextSpace >= lineStart && nextSpace < segEnd ? nextSpace : segEnd;
    } else {
      let low = lineStart;
      let high = segEnd;
      while (low < high) {
        const mid = (low + high + 1) >> 1;
        const w = measureWidth(
          text,
          lineStart,
          mid,
          fontFamily,
          fontWeight,
          fontSize
        );
        if (w <= maxW) low = mid;
        else high = mid - 1;
      }
      if (low <= lineStart) low = lineStart + 1;
      lineEnd = low;
    }

    if (lineEnd > lineStart) {
      out.push({ start: lineStart, end: lineEnd });
    }
    lineStart = lineEnd;
  }
}

export class WrappedTextNode extends RectNode {
  text: string = '';
  fontFamily: string | null = null;
  fontSize: number = 16;
  fontWeight: number = 400;
  color: ColorInt = rgba(0, 0, 0);
  selectionColor: ColorInt = rgba(0, 100, 200, 60);

  get lineHeight(): number {
    return this.fontSize * 1.4;
  }

  wordBreak: WordBreak = WordBreak.BREAK_WORD;
  locale: string | null = null;

  private readonly lines = memo(() => {
    const text = this.text;
    if (text.length === 0) return [] as TextLine[];
    const maxW = this.innerSize(Direction.x);
    const result: TextLine[] = [];
    let pos = 0;
    const len = text.length;

    while (pos < len) {
      const nl = text.indexOf('\n', pos);
      const segEnd = nl >= 0 ? nl : len;
      if (segEnd > pos) {
        wrapSegment(
          text,
          pos,
          segEnd,
          maxW,
          this.wordBreak,
          this.fontFamily,
          this.fontWeight,
          this.fontSize,
          result
        );
      } else {
        if (nl >= 0) result.push({ start: pos, end: pos });
      }
      pos = nl >= 0 ? nl + 1 : len;
    }
    return result;
  });

  private readonly charPositions = memo(() => {
    const lineList = this.lines();
    const result: [number, number][] = [];
    for (let li = 0; li < lineList.length; li++) {
      const line = lineList[li];
      let x = 0;
      for (let i = line.start; i < line.end; i++) {
        result.push([x, li * this.lineHeight]);
        x += measureText(
          this.text[i].toString(),
          this.fontFamily,
          this.fontWeight,
          this.fontSize
        );
      }
    }
    return result;
  });

  private charAt(px: number, py: number): number {
    const lineList = this.lines();
    if (lineList.length === 0) return 0;
    const lineIdx = Math.min(
      Math.max(Math.floor(py / this.lineHeight), 0),
      lineList.length - 1
    );
    const line = lineList[lineIdx];

    let low = line.start;
    let high = line.end;
    while (low < high) {
      const mid = (low + high) >> 1;
      const w = measureWidth(
        this.text,
        line.start,
        mid + 1,
        this.fontFamily,
        this.fontWeight,
        this.fontSize
      );
      if (w <= px) low = mid + 1;
      else high = mid;
    }
    return Math.min(Math.max(low, line.start), line.end);
  }

  override layout(_d: Direction): LayoutFun<LayoutNode> {
    return absoluteLayout();
  }

  override buildChildren(): void {}

  override size(direction: Direction): LayoutSize {
    if (direction === Direction.x) {
      return this.sizeFromParent(direction);
    }
    const lineList = this.lines();
    return sizeFromParent(
      Math.max(lineList.length * this.lineHeight, this.fontSize * 1.4),
      true
    );
  }

  private anchorIndex = createSignal(-1);
  private focusIndex = createSignal(-1);

  get selectionText(): string | null {
    const a = this.anchorIndex.get();
    const f = this.focusIndex.get();
    if (a < 0 || f < 0 || a === f) return null;
    const s = Math.min(a, f);
    const e = Math.max(a, f);
    return this.text.substring(s, e);
  }

  private onMouseDown: boolean = false;

  override mouseDown(e: MouseEvent): void {
    this.anchorIndex.set(this.charAt(e.x, e.y));
    this.focusIndex.set(this.anchorIndex.get());
    this.onMouseDown = true;
    e.stopPropagation();
  }

  constructor(context: StateHolder<Node>) {
    super(context);
    const engineGlobal = context.consume(engineGlobalContext)!;
    const d1 = engineGlobal.registerMouseUp(() => {
      this.onMouseDown = false;
    });
    const ax = memo(() => absolutePosition(this, Direction.x));
    const ay = memo(() => absolutePosition(this, Direction.y));
    const d2 = engineGlobal.registerMouseMove(
      (e: import('./EngineGlobal').GlobalMouseEvent) => {
        if (this.onMouseDown) {
          this.focusIndex.set(this.charAt(e.x - ax(), e.y - ay()));
        }
      }
    );
    context.addDestroy(() => {
      d1();
      d2();
    });
  }

  private setFont(canvas: CanvasRenderingContext2D): void {
    canvas.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily ?? 'sans-serif'}`;
  }

  override drawSelf(canvas: CanvasRenderingContext2D): void {
    if (this.text.length === 0) return;
    const lineList = this.lines();
    const h = this.lineHeight;
    const a = this.anchorIndex.get();
    const f = this.focusIndex.get();

    if (a >= 0 && f >= 0 && a !== f) {
      const selStart = Math.min(a, f);
      const selEnd = Math.max(a, f);
      canvas.fillStyle = colorToCSS(this.selectionColor);
      for (let li = 0; li < lineList.length; li++) {
        const line = lineList[li];
        const ls = Math.max(selStart, line.start);
        const le = Math.min(selEnd, line.end);
        if (ls < le) {
          const leftX =
            ls === line.start
              ? 0
              : measureWidth(
                  this.text,
                  line.start,
                  ls,
                  this.fontFamily,
                  this.fontWeight,
                  this.fontSize
                );
          const rightX = measureWidth(
            this.text,
            line.start,
            le,
            this.fontFamily,
            this.fontWeight,
            this.fontSize
          );
          canvas.fillRect(leftX, li * h, rightX - leftX, h);
        }
      }
    }

    this.setFont(canvas);
    canvas.fillStyle = colorToCSS(this.color);
    for (let li = 0; li < lineList.length; li++) {
      const line = lineList[li];
      const lineText = this.text.substring(line.start, line.end);
      if (lineText.length > 0) {
        canvas.fillText(lineText, 0, li * h + this.fontSize);
      }
    }
  }
}
