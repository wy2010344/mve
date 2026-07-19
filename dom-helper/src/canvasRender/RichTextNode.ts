import { createSignal, memo } from 'wy-helper';
import { StateHolder } from 'mve-core';
import { Direction, Node, absolutePosition } from './Node';
import { RectNode } from './RectNode';
import { layoutSize, LayoutSize } from './layout/LayoutNode';
import { MouseEvent } from './MouseEvent';
import { ColorInt, rgba, colorToCSS } from './Draw';
import { engineGlobalContext } from './EngineGlobal';
import { measureText } from './PlatformCanvas';
import { WordBreak } from './WrappedTextNode';

export interface RichTextSpan {
  text: string;
  fontFamily?: string | null;
  fontSize?: number;
  fontWeight?: number;
  color?: ColorInt;
}

interface SpanRange {
  start: number;
  end: number;
  fontFamily: string | null;
  fontWeight: number;
  fontSize: number;
  color: ColorInt;
}

interface TextLine {
  start: number;
  end: number;
}

interface LineInfo {
  start: number;
  end: number;
  y: number;
  height: number;
}

export class RichTextNode extends RectNode {
  spans: RichTextSpan[] = [];
  selectionColor: ColorInt = rgba(100, 100, 200, 60);
  wordBreak: WordBreak = WordBreak.BREAK_WORD;
  locale: string | null = null;

  private get fullText(): string {
    return this.spans.map(s => s.text).join('');
  }

  private get spanRanges(): SpanRange[] {
    const result: SpanRange[] = [];
    let pos = 0;
    for (const span of this.spans) {
      if (span.text.length > 0) {
        result.push({
          start: pos,
          end: pos + span.text.length,
          fontFamily: span.fontFamily ?? null,
          fontWeight: span.fontWeight ?? 400,
          fontSize: span.fontSize ?? 16,
          color: span.color ?? rgba(0, 0, 0),
        });
        pos += span.text.length;
      }
    }
    return result;
  }

  private measureRichRange(start: number, end: number): number {
    if (start >= end) return 0;
    const text = this.fullText;
    const ranges = this.spanRanges;
    let total = 0;
    let pos = start;
    for (const sr of ranges) {
      if (pos >= end) break;
      if (sr.end <= pos) continue;
      const segStart = Math.max(pos, sr.start);
      const segEnd = Math.min(end, sr.end);
      if (segStart < segEnd) {
        total += measureText(
          text.substring(segStart, segEnd),
          sr.fontFamily,
          sr.fontWeight,
          sr.fontSize
        );
      }
      pos = segEnd;
    }
    return total;
  }

  private measureRichChar(index: number): number {
    const text = this.fullText;
    const ranges = this.spanRanges;
    if (index < 0 || index >= text.length) return 0;
    for (const sr of ranges) {
      if (index >= sr.start && index < sr.end) {
        return measureText(
          text[index].toString(),
          sr.fontFamily,
          sr.fontWeight,
          sr.fontSize
        );
      }
    }
    return 0;
  }

  private charStyleAt(index: number): SpanRange | null {
    const ranges = this.spanRanges;
    for (const sr of ranges) {
      if (index >= sr.start && index < sr.end) return sr;
    }
    return null;
  }

  private readonly lines = memo(() => {
    const text = this.fullText;
    if (text.length === 0) return [] as TextLine[];
    const maxW = this.innerSize(Direction.x);
    const result: TextLine[] = [];
    let pos = 0;
    const len = text.length;

    while (pos < len) {
      const nl = text.indexOf('\n', pos);
      const segEnd = nl >= 0 ? nl : len;
      if (segEnd > pos) {
        this.wrapSegment(pos, segEnd, maxW, result);
      } else {
        if (nl >= 0) result.push({ start: pos, end: pos });
      }
      pos = nl >= 0 ? nl + 1 : len;
    }
    return result;
  });

  private wrapSegment(
    segStart: number,
    segEnd: number,
    maxW: number,
    out: TextLine[]
  ): void {
    if (maxW >= Number.MAX_VALUE) {
      out.push({ start: segStart, end: segEnd });
      return;
    }
    const text = this.fullText;
    const breaks: number[] = [];
    for (let i = segStart + 1; i < segEnd; i++) {
      const ch = text[i - 1];
      if (ch === ' ' || ch === '\n' || ch === '\t') {
        breaks.push(i);
      }
    }

    let lineStart = segStart;
    while (lineStart < segEnd) {
      while (
        lineStart < segEnd &&
        (text[lineStart] === ' ' || text[lineStart] === '\t')
      )
        lineStart++;
      if (lineStart >= segEnd) break;

      if (this.wordBreak === WordBreak.ANY_CHAR) {
        let cx = 0;
        let ci = lineStart;
        while (ci < segEnd) {
          const cw = this.measureRichChar(ci);
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
        if (bp > lineStart && this.measureRichRange(lineStart, bp) <= maxW) {
          lastFitIdx = bp;
          break;
        }
      }

      let lineEnd: number;
      if (lastFitIdx !== null) {
        lineEnd = lastFitIdx;
      } else if (this.wordBreak === WordBreak.PHRASE) {
        const nextSpace = text.indexOf(' ', lineStart);
        lineEnd =
          nextSpace >= lineStart && nextSpace < segEnd ? nextSpace : segEnd;
      } else {
        let low = lineStart;
        let high = segEnd;
        while (low < high) {
          const mid = (low + high + 1) >> 1;
          const w = this.measureRichRange(lineStart, mid);
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

  private maxFontSizeInLine(lineStart: number, lineEnd: number): number {
    const ranges = this.spanRanges;
    let maxFs = 0;
    for (const sr of ranges) {
      if (sr.start < lineEnd && sr.end > lineStart) {
        maxFs = Math.max(maxFs, sr.fontSize);
      }
    }
    return Math.max(maxFs, 1);
  }

  private readonly lineInfos = memo(() => {
    const lineList = this.lines();
    const result: LineInfo[] = [];
    let y = 0;
    for (const line of lineList) {
      const h = this.maxFontSizeInLine(line.start, line.end) * 1.4;
      result.push({ start: line.start, end: line.end, y, height: h });
      y += h;
    }
    return result;
  });

  private readonly charPositions = memo(() => {
    const infoList = this.lineInfos();
    const result: [number, number][] = [];
    for (const info of infoList) {
      let x = 0;
      for (let i = info.start; i < info.end; i++) {
        result.push([x, info.y]);
        x += this.measureRichChar(i);
      }
    }
    return result;
  });

  private charAt(px: number, py: number): number {
    const infoList = this.lineInfos();
    if (infoList.length === 0) return 0;

    let lineIdx = 0;
    for (let i = 0; i < infoList.length; i++) {
      const info = infoList[i];
      if (py < info.y + info.height) {
        lineIdx = i;
        break;
      }
      if (i === infoList.length - 1) lineIdx = i;
    }
    const info = infoList[lineIdx];

    let low = info.start;
    let high = info.end;
    while (low < high) {
      const mid = (low + high) >> 1;
      const w = this.measureRichRange(info.start, mid + 1);
      if (w <= px) low = mid + 1;
      else high = mid;
    }
    return Math.min(Math.max(low, info.start), info.end);
  }
  override buildChildren(): void {}

  override size(direction: Direction): LayoutSize {
    if (direction === Direction.x) {
      return this.sizeFromParent(direction);
    }
    const infoList = this.lineInfos();
    const totalH =
      infoList.length > 0
        ? infoList[infoList.length - 1].y + infoList[infoList.length - 1].height
        : this.maxFontSizeInLine(0, 0) * 1.4;
    return layoutSize(totalH, true);
  }

  private anchorIndex = createSignal(-1);
  private focusIndex = createSignal(-1);

  get selectionText(): string | null {
    const a = this.anchorIndex.get();
    const f = this.focusIndex.get();
    if (a < 0 || f < 0 || a === f) return null;
    const s = Math.min(a, f);
    const e = Math.max(a, f);
    return this.fullText.substring(s, e);
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

  override drawSelf(canvas: CanvasRenderingContext2D): void {
    const text = this.fullText;
    if (text.length === 0) return;
    const infoList = this.lineInfos();
    const a = this.anchorIndex.get();
    const f = this.focusIndex.get();

    if (a >= 0 && f >= 0 && a !== f) {
      const selStart = Math.min(a, f);
      const selEnd = Math.max(a, f);
      canvas.fillStyle = colorToCSS(this.selectionColor);
      for (const info of infoList) {
        const ls = Math.max(selStart, info.start);
        const le = Math.min(selEnd, info.end);
        if (ls < le) {
          const leftX =
            ls === info.start ? 0 : this.measureRichRange(info.start, ls);
          const rightX = this.measureRichRange(info.start, le);
          canvas.fillRect(leftX, info.y, rightX - leftX, info.height);
        }
      }
    }

    for (const info of infoList) {
      let x = 0;
      let i = info.start;
      while (i < info.end) {
        const sr = this.charStyleAt(i);
        if (!sr) break;
        const segEnd = Math.min(info.end, sr.end);
        const segText = text.substring(i, segEnd);
        if (segText.length > 0) {
          canvas.font = `${sr.fontWeight} ${sr.fontSize}px ${sr.fontFamily ?? 'sans-serif'}`;
          canvas.fillStyle = colorToCSS(sr.color);
          canvas.fillText(
            segText,
            x,
            info.y + sr.fontSize
          );
          x += this.measureRichRange(i, segEnd);
        }
        i = segEnd;
      }
    }
  }
}
