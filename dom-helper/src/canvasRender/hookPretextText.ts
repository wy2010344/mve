import {
  prepareWithSegments,
  layoutWithLines,
  type PreparedTextWithSegments,
  type LayoutLine,
  type PrepareOptions,
} from '@chenglou/pretext';
import {
  GetValue,
  LayoutNode,
  memo,
  Point,
  Quote,
  ValueOrGet,
  valueOrGetToGet,
} from 'wy-helper';
import {
  DrawTextWrapExt,
  FontStyle,
  makeCurrentDefaultFont,
  makeFontString,
  measureLineHeight,
} from 'wy-dom-helper/canvas';
import { CMNode, getOneCtx } from './hookDraw';
import { DrawArgRect, DrawRectConfig, hookDrawRect } from './hookDrawRect';

export type PretextWrapConfig = {
  text: string;
  lineHeight?: number | Quote<number>;

  whiteSpace?: PrepareOptions['whiteSpace'];
  wordBreak?: PrepareOptions['wordBreak'];
  letterSpacing?: number;
  maxLines?: number;
} & Partial<FontStyle>;

export type MeasuredPretextOut = {
  lines: LayoutLine[];
  height: number;
  width: number;
  lineCount: number;
  prepared: PreparedTextWithSegments;
  lineHeight: number;
  lineDiffStart: number;
  font: string;
};

type DrawRectCtx = {
  glyphData(): GlyphData;
};

export type DrawRectPretextWrap = LayoutNode<CMNode, keyof Point<number>> &
  DrawRectCtx;

type Glyph = {
  char: string;
  x: number;
  y: number;
  w: number;
};

type GlyphData = {
  list: { y: number; glyphs: Glyph[] }[];
  lineHeight: number;
};

const _graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: 'grapheme',
});

function truncateLine(
  line: LayoutLine,
  prepared: PreparedTextWithSegments,
  maxWidth: number,
  ellipsisWidth: number
): LayoutLine | null {
  const targetWidth = maxWidth - ellipsisWidth;
  if (targetWidth <= 0) return null;
  let accumulated = 0;
  let lastSegIdx = line.start.segmentIndex;
  let lastGraphemeIdx = line.start.graphemeIndex;
  const ls = prepared.letterSpacing;

  for (let si = line.start.segmentIndex; si < line.end.segmentIndex; si++) {
    const segWidth = prepared.widths[si];
    const advances = prepared.breakableFitAdvances[si];

    if (accumulated + segWidth > targetWidth) {
      if (advances !== null) {
        for (let g = 0; g < advances.length; g++) {
          const gw = advances[g] + (g > 0 ? ls : 0);
          if (accumulated + gw > targetWidth) break;
          accumulated += gw;
          lastSegIdx = si;
          lastGraphemeIdx = g + 1;
        }
      }
      break;
    }

    accumulated += segWidth;
    lastSegIdx = si + 1;
    lastGraphemeIdx = 0;
  }

  if (lastGraphemeIdx === 0 && lastSegIdx === line.start.segmentIndex) {
    return null;
  }

  const parts: string[] = [];
  for (let si = line.start.segmentIndex; si < lastSegIdx; si++) {
    const text = prepared.segments[si];
    if (si === lastSegIdx - 1 && lastGraphemeIdx > 0) {
      let gi = 0;
      for (const g of _graphemeSegmenter.segment(text)) {
        if (gi >= lastGraphemeIdx) break;
        parts.push(g.segment);
        gi++;
      }
    } else {
      parts.push(text);
    }
  }
  parts.push('…');

  return {
    text: parts.join(''),
    width: accumulated + ellipsisWidth,
    start: line.start,
    end: { segmentIndex: lastSegIdx, graphemeIndex: lastGraphemeIdx },
  };
}

function buildGlyphs(
  lines: LayoutLine[],
  prepared: PreparedTextWithSegments,
  lineHeight: number
): GlyphData {
  const ls = prepared.letterSpacing;
  const list = lines.map((line, i) => {
    const y = i * lineHeight;
    const glyphs: Glyph[] = [];
    let x = 0;
    const ss = line.start.segmentIndex;
    const sg = line.start.graphemeIndex;
    const es = line.end.segmentIndex;
    const eg = line.end.graphemeIndex;

    for (let si = ss; si <= es; si++) {
      const advances = prepared.breakableFitAdvances[si];
      const segGraphemeCount = advances?.length ?? 1;
      const firstG = si === ss ? sg : 0;
      const lastG = si === es && eg > 0 ? eg : segGraphemeCount;

      if (advances && advances.length) {
        for (let g = firstG; g < lastG; g++) {
          let gw = advances[g];
          if (g > 0 && ls !== 0) gw += ls;
          glyphs.push({ char: '', x, y, w: gw });
          x += gw;
        }
      } else {
        const gw = prepared.widths[si];
        glyphs.push({ char: '', x, y, w: gw });
        x += gw;
      }
    }
    return { y, glyphs };
  });
  return { list, lineHeight };
}

class PretextTextWrapHelper {
  rect!: LayoutNode<CMNode, keyof Point<number>>;
  readonly getConfig: GetValue<PretextWrapConfig>;
  readonly measureOut: GetValue<MeasuredPretextOut>;
  readonly glyphData: GetValue<GlyphData>;
  constructor(
    config: ValueOrGet<PretextWrapConfig>,
    width: ValueOrGet<number>
  ) {
    this.getConfig = valueOrGetToGet(config);
    const getWidth = valueOrGetToGet(width);
    this.measureOut = memo(() => {
      const c = this.getConfig();
      makeCurrentDefaultFont(c);
      const font = makeFontString(c);
      const ctx = getOneCtx();
      ctx.font = font;
      const prepared = prepareWithSegments(c.text, font, {
        whiteSpace: c.whiteSpace,
        wordBreak: c.wordBreak,
        letterSpacing: c.letterSpacing,
      });
      const maxWidth = getWidth();
      const m = ctx.measureText('M');
      const { lineDiffStart, lineHeight } = measureLineHeight(m, c.lineHeight);
      const result = layoutWithLines(prepared, maxWidth, lineHeight);
      let lines = result.lines;
      if (c.maxLines != null && lines.length > c.maxLines && lines.length > 0) {
        const maxed = lines.slice(0, c.maxLines);
        const last = maxed[maxed.length - 1];
        if (last.width > 0) {
          const ellipsisWidth = ctx.measureText('…').width;
          const truncated = truncateLine(
            last,
            prepared,
            maxWidth,
            ellipsisWidth
          );
          if (truncated !== null) {
            maxed[maxed.length - 1] = truncated;
          }
        }
        lines = maxed;
      }
      return {
        lines,
        height: lines.length * lineHeight,
        width: maxWidth,
        lineCount: lines.length,
        prepared,
        lineHeight,
        lineDiffStart,
        font,
      };
    });
    this.glyphData = memo(() => {
      const mout = this.measureOut();
      return buildGlyphs(mout.lines, mout.prepared, mout.lineHeight);
    });
  }
  withSelect(selectStart: ValueOrGet<number>, selectEnd: ValueOrGet<number>) {
    return new PretextWithSelect(this, this.rect, selectStart, selectEnd);
  }
}

export class PretextWithSelect {
  readonly selectStart: GetValue<number>;
  readonly selectEnd: GetValue<number>;
  readonly memoGraphs: GetValue<GlyphData>;
  readonly cursorPosition: GetValue<
    | {
        x: number;
        y: number;
      }
    | undefined
  >;
  constructor(
    get: DrawRectCtx,
    readonly rect: LayoutNode<CMNode, keyof Point<number>>,
    selectStart: ValueOrGet<number>,
    selectEnd: ValueOrGet<number>
  ) {
    this.selectStart = valueOrGetToGet(selectStart);
    this.selectEnd = valueOrGetToGet(selectEnd);
    this.memoGraphs = get.glyphData;
    this.cursorPosition = memo(() => {
      const start = this.selectStart();
      const end = this.selectEnd();
      if (start == end) {
        return this.getPosition(start);
      }
    });
  }
  getIndex(e: Point) {
    const ex = e.x - this.rect.axis.x.paddingStart();
    const ey = e.y - this.rect.axis.y.paddingStart();
    const { list: mg, lineHeight } = this.memoGraphs();
    let index = 0;
    for (let y = 0; y < mg.length; y++) {
      const row = mg[y];
      if (row.y <= ey && ey < row.y + lineHeight) {
        for (let x = 0; x < row.glyphs.length; x++) {
          const cell = row.glyphs[x];
          if (ex < cell.x + cell.w / 2) {
            return index;
          }
          index++;
        }
        return index;
      }
      index += row.glyphs.length;
    }
    return index;
  }
  getPosition(start: number) {
    const { list: mg, lineHeight } = this.memoGraphs();
    let mx = 0,
      my = 0;
    let index = 0;
    for (let y = 0; y < mg.length; y++) {
      const row = mg[y];
      const nextIndex = index + row.glyphs.length;
      if (index <= start && start < nextIndex) {
        const diff = start - index;
        const cell = row.glyphs[diff];
        mx = cell.x;
        my = row.y;
        break;
      }
      index = nextIndex;
    }
    return {
      x: mx,
      y: my,
    };
  }
  draw(
    ctx: {
      translate(x: number, y: number): void;
      fillRect(x: number, y: number, width: number, height: number): void;
    },
    zeroWidth = 2
  ) {
    const px = this.rect.axis.x.paddingStart();
    const py = this.rect.axis.y.paddingStart();
    ctx.translate(px, py);
    const { list: mg, lineHeight } = this.memoGraphs();
    const start = this.selectStart();
    const end = this.selectEnd();
    const xy = this.cursorPosition();
    if (xy) {
      ctx.fillRect(xy.x, xy.y, zeroWidth, lineHeight);
    } else {
      let beginY = 0,
        endY = 0;
      let beginX = 0,
        endX = 0;
      const [min, max] = start > end ? [end, start] : [start, end];
      let index = 0;
      for (let y = 0; y < mg.length; y++) {
        const row = mg[y];
        for (let x = 0; x < row.glyphs.length; x++) {
          if (index == min) {
            beginY = y;
            beginX = x;
          }
          if (index == max) {
            endY = y;
            endX = x;
            break;
          }
          index++;
        }
      }
      function fillSelect(y: number, start: number, end: number) {
        if (start == end) {
          return;
        }
        ctx.fillRect(start, y, end - start, lineHeight);
      }
      if (beginY == endY) {
        const row = mg[beginY];
        const start = row.glyphs[beginX].x;
        const end = row.glyphs[endX];
        fillSelect(row.y, start, end.x);
      } else {
        const beginRow = mg[beginY];
        const start = beginRow.glyphs[beginX].x;
        const end = beginRow.glyphs.at(-1)!;
        fillSelect(beginRow.y, start, end.x + end?.w);
        for (let i = beginY + 1; i < endY; i++) {
          const row = mg[i];
          const end = row.glyphs.at(-1)!;
          fillSelect(row.y, 0, end.x + end?.w);
        }
        const endRow = mg[endY];
        fillSelect(endRow.y, 0, endRow.glyphs[endX].x);
      }
    }
    ctx.translate(-px, -py);
  }
}

export type DrawArgPretextWrap = DrawArgRect & {
  draw(info?: DrawTextWrapExt): void;
};

export function drawPretextTextWrap(
  ctx: CanvasRenderingContext2D,
  out: MeasuredPretextOut,
  arg?: DrawTextWrapExt
) {
  const x = arg?.x || 0;
  const y = arg?.y || 0;
  ctx.font = out.font;
  ctx.textBaseline = 'top';
  const direction = arg?.direction || 'ltr';
  ctx.direction = direction;
  let fun: 'strokeText' | 'fillText';
  if (arg?.stroke) {
    ctx.strokeStyle = arg.style || 'black';
    fun = 'strokeText';
  } else {
    ctx.fillStyle = arg?.style || 'black';
    fun = 'fillText';
  }
  let curY = y;
  const textAlign = arg?.textAlign || 'left';
  for (let i = 0; i < out.lines.length; i++) {
    const line = out.lines[i];
    let curX = x;
    if (textAlign == 'center') {
      curX = x + (out.width - line.width) / 2;
    } else if (
      (textAlign == 'end' && direction == 'ltr') ||
      (textAlign == 'start' && direction == 'rtl')
    ) {
      curX = x + out.width - line.width;
    }
    ctx[fun](line.text, curX, curY + out.lineDiffStart);
    curY += out.lineHeight;
  }
}

export function hookPretextTextWrap(
  args: Omit<DrawRectConfig, 'height' | 'heightAsInner' | 'draw'> & {
    config: ValueOrGet<PretextWrapConfig>;
    draw?(e: DrawArgPretextWrap): void;
  }
) {
  const m = new PretextTextWrapHelper(args.config, () => {
    return n.axis.x.innerSize();
  });
  const n = hookDrawRect({
    ...args,
    heightAsInner: true,
    height() {
      return m.measureOut().height;
    },
    draw(e) {
      function draw(info?: DrawTextWrapExt) {
        drawPretextTextWrap(e.ctx as CanvasRenderingContext2D, m.measureOut(), {
          ...info,
          y: e.rect.axis.y.paddingStart() + (info?.y ?? 0),
          x: e.rect.axis.x.paddingStart() + (info?.x ?? 0),
        });
      }
      if (args.draw) {
        const ee = e as DrawArgPretextWrap;
        ee.draw = draw;
        args.draw(ee);
      } else {
        draw();
      }
    },
  }) as LayoutNode<CMNode, keyof Point<number>> & {
    helper: PretextTextWrapHelper;
  };
  m.rect = n;
  n.helper = m;
  return n;
}
