import type {
  CanvasKit,
  FontCollection,
  Paragraph,
  ParagraphStyle,
  TextStyle,
} from 'canvaskit-wasm';
import { getCanvasKit } from './CanvasKit';
import type { ColorInt } from './Draw';

/**
 * 文本装饰线（对标 Kotlin TextDecoration）：渲染为文字同色实线；
 * 平台（CanvasKit 单值 decoration）不支持组合时按下划线优先，静默降级。
 */
export interface TextDecoration {
  underline?: boolean;
  lineThrough?: boolean;
}

/** 无装饰线（对标 Kotlin TextDecoration.None） */
export const textDecorationNone: TextDecoration = {};

export interface RichTextStyle {
  fontFamily?: string | null;
  fontSize?: number;
  fontWeight?: number;
  /** 斜体（对标 Kotlin RichTextStyle.italic） */
  italic?: boolean;
  color?: ColorInt;
  letterSpacing?: number;
  wordSpacing?: number;
  lineHeightMultiplier?: number | null;
  /** 下划线 / 删除线（对标 Kotlin RichTextStyle.decoration） */
  decoration?: TextDecoration;
}

export interface RichTextSpan {
  text: string;
  style?: RichTextStyle;
  /**
   * 链接目标（对标 Kotlin PlatformSpan.url）：非空时该片段可点击，
   * 由 RichTextNode 命中判定后经 UrlOpener 的平台实现打开；
   * 仅引擎层元数据，不参与 CanvasKit 样式（外观由 style 驱动）。
   */
  url?: string;
}

export enum RectStyle {
  TIGHT = 'TIGHT',
  FULL = 'FULL',
}

export enum TextAlign {
  START = 'START',
  CENTER = 'CENTER',
  END = 'END',
  JUSTIFY = 'JUSTIFY',
}

export interface TextRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const INT_MAX_VALUE = 2147483647;

const DEFAULT_STYLE: RichTextStyle = {
  fontFamily: null,
  fontSize: 16,
  fontWeight: 400,
  italic: false,
  color: 0xff000000,
  letterSpacing: 0,
  wordSpacing: 0,
  lineHeightMultiplier: null,
  decoration: textDecorationNone,
};

function normalizeStyle(style: RichTextStyle = {}): Required<
  Omit<RichTextStyle, 'fontFamily' | 'lineHeightMultiplier'>
> & {
  fontFamily: string | null;
  lineHeightMultiplier: number | null;
} {
  const s = { ...DEFAULT_STYLE, ...style };
  return {
    fontFamily: s.fontFamily ?? null,
    fontSize: s.fontSize ?? 16,
    fontWeight: s.fontWeight ?? 400,
    italic: s.italic ?? false,
    color: s.color ?? 0xff000000,
    letterSpacing: s.letterSpacing ?? 0,
    wordSpacing: s.wordSpacing ?? 0,
    lineHeightMultiplier: s.lineHeightMultiplier ?? null,
    decoration: s.decoration ?? textDecorationNone,
  };
}

const pendingFonts = new Map<string, ArrayBuffer>();
let collection: FontCollection | null = null;

function toArrayBuffer(bytes: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (bytes instanceof ArrayBuffer) return bytes;
  return (bytes.buffer as ArrayBuffer).slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  );
}

/**
 * 注册自定义字体，供后续 buildParagraph 使用（family 作为文本样式中的 fontFamily）。
 * 可在 CanvasKit 加载前后调用；重复注册同族会替换并重建字体集合。
 */
export function registerFont(
  family: string,
  bytes: ArrayBuffer | Uint8Array
): void {
  pendingFonts.set(family, toArrayBuffer(bytes));
  collection?.delete();
  collection = null;
}

function getFontCollection(ck: CanvasKit): FontCollection {
  if (!collection) {
    const provider = ck.TypefaceFontProvider.Make();
    for (const [family, bytes] of pendingFonts) {
      provider.registerFont(bytes, family);
    }
    const fc = ck.FontCollection.Make();
    fc.setDefaultFontManager(provider);
    collection = fc;
  }
  return collection;
}

/** CanvasKit 的颜色是 0~1 浮点的 Float32Array（RGBA），不是 0~255 整数 */
function colorToInputColor(color: ColorInt): number[] {
  const r = ((color >> 16) & 0xff) / 255;
  const g = ((color >> 8) & 0xff) / 255;
  const b = (color & 0xff) / 255;
  const a = ((color >> 24) & 0xff) / 255;
  return [r, g, b, a];
}

function toFontWeight(ck: CanvasKit, weight: number) {
  const list = [
    ck.FontWeight.Invisible,
    ck.FontWeight.Thin,
    ck.FontWeight.ExtraLight,
    ck.FontWeight.Light,
    ck.FontWeight.Normal,
    ck.FontWeight.Medium,
    ck.FontWeight.SemiBold,
    ck.FontWeight.Bold,
    ck.FontWeight.ExtraBold,
    ck.FontWeight.Black,
    ck.FontWeight.ExtraBlack,
  ];
  let best = list[4];
  let diff = Infinity;
  for (const fw of list) {
    const d = Math.abs(fw.value - weight);
    if (d < diff) {
      diff = d;
      best = fw;
    }
  }
  return best;
}

function toTextAlign(ck: CanvasKit, textAlign: TextAlign) {
  switch (textAlign) {
    case TextAlign.CENTER:
      return ck.TextAlign.Center;
    case TextAlign.END:
      return ck.TextAlign.End;
    case TextAlign.JUSTIFY:
      return ck.TextAlign.Justify;
    default:
      return ck.TextAlign.Start;
  }
}

function makeTextStyle(ck: CanvasKit, style: RichTextStyle = {}): TextStyle {
  const s = normalizeStyle(style);
  const ts: TextStyle = {
    color: colorToInputColor(s.color),
    fontStyle: {
      weight: toFontWeight(ck, s.fontWeight),
      width: ck.FontWidth.Normal,
      slant: s.italic ? ck.FontSlant.Italic : ck.FontSlant.Upright,
    },
  };
  if (s.fontFamily) {
    ts.fontFamilies = [s.fontFamily];
  }
  if (s.fontSize !== 16) {
    ts.fontSize = s.fontSize;
  }
  if (s.letterSpacing !== 0) {
    ts.letterSpacing = s.letterSpacing;
  }
  if (s.wordSpacing !== 0) {
    ts.wordSpacing = s.wordSpacing;
  }
  if (s.lineHeightMultiplier != null) {
    ts.heightMultiplier = s.lineHeightMultiplier;
  }
  // 装饰线：CanvasKit 的 decoration 是单值常量，组合时下划线优先（静默降级）
  if (s.decoration?.underline) {
    ts.decoration = ck.UnderlineDecoration;
  } else if (s.decoration?.lineThrough) {
    ts.decoration = ck.LineThroughDecoration;
  }
  return ts;
}

export interface LineRect extends TextRect {
  /** 行起点（文本缓冲索引，不含行首软换行符）。 */
  start: number;
  /** 行终点（文本缓冲索引，不含换行符）。 */
  end: number;
}

export class PlatformParagraph {
  constructor(readonly paragraph: Paragraph) {}

  height(): number {
    return this.paragraph.getHeight();
  }

  width(): number {
    return this.paragraph.getLongestLine();
  }

  getGlyphPositionAtCoordinate(dx: number, dy: number): number {
    return this.paragraph.getGlyphPositionAtCoordinate(dx, dy).pos;
  }

  getRectsForRange(start: number, end: number, style: RectStyle): TextRect[] {
    if (start >= end) return [];
    const ck = getCanvasKit();
    if (!ck) return [];
    const [hStyle, wStyle] =
      style == RectStyle.TIGHT
        ? [ck.RectHeightStyle.Tight, ck.RectWidthStyle.Tight]
        : [ck.RectHeightStyle.Max, ck.RectWidthStyle.Max];
    return this.paragraph
      .getRectsForRange(start, end, hStyle, wStyle)
      .map(it => {
        const r = it.rect;
        return { left: r[0], top: r[1], right: r[2], bottom: r[3] };
      });
  }

  /** 布局层行边界（与 getGlyphPositionAtCoordinate 的行判定一致）。 */
  getLineMetrics(): LineRect[] {
    return this.paragraph.getLineMetrics().map(m => ({
      left: m.left,
      top: m.baseline - m.ascent,
      right: m.left + m.width,
      bottom: m.baseline + m.descent,
      start: m.startIndex,
      end: m.endIndex,
    }));
  }

  delete(): void {
    this.paragraph.delete();
  }
}

export function buildParagraph(
  spans: RichTextSpan[],
  maxWidth: number,
  maxLines: number = INT_MAX_VALUE,
  ellipsis: string = '\u2026',
  textAlign: TextAlign = TextAlign.START
): PlatformParagraph | null {
  const ck = getCanvasKit();
  if (!ck) {
    return null;
  }
  const ps = new ck.ParagraphStyle({
    textAlign: toTextAlign(ck, textAlign),
    textStyle: makeTextStyle(ck),
    maxLines: maxLines !== INT_MAX_VALUE ? maxLines : undefined,
    ellipsis: maxLines !== INT_MAX_VALUE ? ellipsis : undefined,
  });
  const builder = ck.ParagraphBuilder.MakeFromFontCollection(
    ps,
    getFontCollection(ck)
  );
  for (const span of spans) {
    if (!span.text) continue;
    builder.pushStyle(new ck.TextStyle(makeTextStyle(ck, span.style)));
    builder.addText(span.text);
    builder.pop();
  }
  const paragraph = builder.build();
  builder.delete();
  paragraph.layout(maxWidth);
  return new PlatformParagraph(paragraph);
}
