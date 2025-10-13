import {
  GetValue,
  LayoutNode,
  memo,
  Point,
  quote,
  Quote,
  ValueOrGet,
  valueOrGetToGet,
} from 'wy-helper';
import {
  drawTextWrap,
  measureTextWrap,
  DrawTextWrapExt,
  TextWrapTextConfig,
  drawText,
  measureText,
  DrawTextExt,
  OCanvasTextDrawingStyles,
  MeasuredTextWrapOut,
  setDrawingStyle,
} from 'wy-dom-helper/canvas';
import { CMNode, getOneCtx } from './hookDraw';
import { DrawArgRect, DrawRectConfig, hookDrawRect } from './hookDrawRect';

type TextWrapConfig = TextWrapTextConfig & {
  text: string;
  lineHeight?: number | Quote<number>;
  maxLines?: number;
};

export type DrawTextConfig = Omit<
  OCanvasTextDrawingStyles,
  'textBaseline' | 'textAlign'
> & {
  text: string;
};

let currentDefaultFont: CSSStyleDeclaration = undefined as any;

export type MeasuredTextOut = DrawTextConfig & {
  textBaseline?: CanvasTextBaseline;
  measure: TextMetrics;
  height: number;
  lineDiffStart: number;
};
function makeCurrentDefaultFont(out: any) {
  if (!currentDefaultFont) {
    currentDefaultFont = getComputedStyle(document.body);
  }
  const def = currentDefaultFont;
  out.fontFamily = out.fontFamily || def.fontFamily;
  out.fontSize = out.fontSize || def.fontSize;
  out.fontStyle = out.fontStyle || def.fontStyle;
  out.fontWeight = out.fontWeight || def.fontWeight;
}
type DrawTextOut = Omit<DrawTextExt, 'y' | 'x'>;
export type DrawRectText = LayoutNode<CMNode, keyof Point<number>> & {
  measureOut(): MeasuredTextOut;
};

/**
 * 宽度使用自容器的宽度
 */
export class CtxTextWrapHelper {
  rect!: LayoutNode<CMNode, keyof Point<number>>;
  readonly getConfig: GetValue<TextWrapConfig>;
  /**
   * 取它的高度
   */
  readonly measureOut: GetValue<MeasuredTextWrapOut>;
  constructor(
    /**与字体测量相关 */
    config: ValueOrGet<TextWrapConfig>,
    width: ValueOrGet<number>
    /**只与绘制相关 */
  ) {
    this.getConfig = valueOrGetToGet(config);
    const getWidth = valueOrGetToGet(width);
    this.measureOut = memo(() => {
      const c = this.getConfig();
      makeCurrentDefaultFont(c);
      const ctx = getOneCtx();
      return measureTextWrap(ctx, c.text, getWidth(), c);
    });
  }
  measureCtx() {
    const c = this.getConfig();
    makeCurrentDefaultFont(c);
    const ctx = getOneCtx();
    setDrawingStyle(ctx, c, true);
    return ctx;
  }

  withSelect(selectStart: ValueOrGet<number>, selectEnd: ValueOrGet<number>) {
    return new DrawTextWrapWithSelect(this, this.rect, selectStart, selectEnd);
  }
}

type DrawRectCtx = {
  //获得供测量的ctx
  measureCtx(): CanvasRenderingContext2D;
  measureOut(): MeasuredTextWrapOut;
};
export type DrawRectTextWrap = LayoutNode<CMNode, keyof Point<number>> &
  DrawRectCtx;

type Glyph = {
  char: string;
  x: number;
  y: number;
  w: number;
};

export class DrawTextWrapWithSelect {
  readonly selectStart: GetValue<number>;
  readonly selectEnd: GetValue<number>;
  readonly memoGraphs: GetValue<{
    list: {
      y: number;
      glyphs: Glyph[];
    }[];
    lineHeight: number;
  }>;
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
    this.memoGraphs = memo(() => {
      const mout = get.measureOut();
      const ctx = get.measureCtx();
      const list = mout.lines.map((line, i) => {
        const chars = [...line.text];
        let beforeWidth = 0;
        const y = i * mout.lineHeight;
        const glyphs: Glyph[] = [];
        for (let i = 0; i < chars.length; i++) {
          const subText = chars.slice(0, i + 1).join('');
          const afterWidth = ctx.measureText(subText).width;
          glyphs.push({
            char: chars[i],
            x: beforeWidth,
            y,
            w: afterWidth - beforeWidth,
          });
          beforeWidth = afterWidth;
        }
        return {
          y,
          glyphs,
        };
      });
      return {
        list,
        lineHeight: mout.lineHeight,
      };
    });
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
    const notFound = true;
    for (let y = 0; y < mg.length && notFound; y++) {
      const row = mg[y];
      if (row.y < ey && ey < row.y + lineHeight) {
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
    let notFound = true;
    let index = 0;
    for (let y = 0; y < mg.length && notFound; y++) {
      const row = mg[y];
      const nextIndex = index + row.glyphs.length;
      if (index <= start && start < nextIndex) {
        const diff = start - index;
        const cell = row.glyphs[diff];
        mx = cell.x;
        my = row.y;
        notFound = false;
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
      let notFound = true;
      for (let y = 0; y < mg.length && notFound; y++) {
        const row = mg[y];
        for (let x = 0; x < row.glyphs.length; x++) {
          if (index == min) {
            beginY = y;
            beginX = x;
          }
          if (index == max) {
            endY = y;
            endX = x;
            notFound = false;
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

/**
 * 看来还是需要hookDrawTextWrap与hookDrawText
 * 因为是内容撑开的,所有padding肯定在内容之外
 */

export type DrawArgText = DrawArgRect & {
  draw(info?: DrawTextExt): void;
};
export function hookDrawText(
  args: Omit<
    DrawRectConfig,
    'width' | 'height' | 'widthAsInner' | 'heightAsInner' | 'draw'
  > & {
    config: ValueOrGet<DrawTextConfig>;
    height?: Quote<number> | number;
    draw?(e: DrawArgText): void;
  }
) {
  const getConfig = valueOrGetToGet(args.config);
  const getHeight = valueOrGetToGet(args.height ?? quote);
  const measureOut = memo(() => {
    const ctx = getOneCtx();
    const c = getConfig();
    const out = { ...c } as MeasuredTextOut;
    makeCurrentDefaultFont(out);
    out.textBaseline = 'top';
    const m = measureText(ctx, c.text, out);
    out.measure = m;
    const fontHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    let lineHeight = getHeight(fontHeight);
    const minLineHeight = fontHeight * 1.5;
    if (lineHeight < minLineHeight) {
      lineHeight = minLineHeight;
    }
    out.height = lineHeight;
    out.lineDiffStart = (lineHeight - fontHeight) / 2;
    return out;
  });
  const n = hookDrawRect({
    ...args,
    widthAsInner: true,
    width() {
      return measureOut().measure.width;
    },
    heightAsInner: true,
    height() {
      return measureOut().height;
    },
    draw(e) {
      function draw(info?: DrawTextExt) {
        drawText(e.ctx, measureOut(), {
          ...info,
          y: e.rect.axis.y.paddingStart() + (info?.y ?? 0),
          x: e.rect.axis.x.paddingStart() + (info?.x ?? 0),
        });
      }
      if (args.draw) {
        const ee = e as DrawArgText;
        ee.draw = draw;
        args.draw!(ee);
        args.draw(ee);
      } else {
        draw();
      }
    },
  }) as LayoutNode<CMNode, keyof Point<number>> & {
    measureOut: GetValue<MeasuredTextOut>;
  };
  n.measureOut = measureOut;
  return n;
}
export type DrawArgTextWrap = DrawArgRect & {
  draw(info?: DrawTextWrapExt): void;
};
export function hookDrawTextWrap(
  args: Omit<DrawRectConfig, 'height' | 'heightAsInner' | 'draw'> & {
    config: ValueOrGet<TextWrapConfig>;
    draw?(e: DrawArgTextWrap): void;
  }
) {
  const m = new CtxTextWrapHelper(args.config, () => {
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
        drawTextWrap(e.ctx, m.measureOut(), {
          ...info,
          y: e.rect.axis.y.paddingStart() + (info?.y ?? 0),
          x: e.rect.axis.x.paddingStart() + (info?.x ?? 0),
        });
      }
      if (args.draw) {
        const ee = e as DrawArgTextWrap;
        ee.draw = draw;
        args.draw!(ee);
      } else {
        draw();
      }
    },
  }) as LayoutNode<CMNode, keyof Point<number>> & {
    helper: CtxTextWrapHelper;
  };
  m.rect = n;
  n.helper = m;
  return n;
}
