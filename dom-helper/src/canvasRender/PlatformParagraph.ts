import type {
  CanvasKit,
  FontCollection,
  Paragraph,
  ParagraphStyle,
  TextStyle,
} from 'canvaskit-wasm';
import { getCanvasKit } from './CanvasKitLoader';
import type { ColorInt } from './Draw';

export interface RichTextStyle {
  fontFamily?: string | null;
  fontSize?: number;
  fontWeight?: number;
  color?: ColorInt;
  letterSpacing?: number;
  wordSpacing?: number;
  lineHeightMultiplier?: number | null;
}

export interface RichTextSpan {
  text: string;
  style?: RichTextStyle;
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
  color: 0xff000000,
  letterSpacing: 0,
  wordSpacing: 0,
  lineHeightMultiplier: null,
};

function normalizeStyle(style: RichTextStyle = {}): Required<Omit<RichTextStyle, 'fontFamily' | 'lineHeightMultiplier'>> & {
  fontFamily: string | null;
  lineHeightMultiplier: number | null;
} {
  const s = { ...DEFAULT_STYLE, ...style };
  return {
    fontFamily: s.fontFamily ?? null,
    fontSize: s.fontSize ?? 16,
    fontWeight: s.fontWeight ?? 400,
    color: s.color ?? 0xff000000,
    letterSpacing: s.letterSpacing ?? 0,
    wordSpacing: s.wordSpacing ?? 0,
    lineHeightMultiplier: s.lineHeightMultiplier ?? null,
  };
}

const pendingFonts = new Map<string, ArrayBuffer>();
let collection: FontCollection | null = null;

function toArrayBuffer(bytes: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (bytes instanceof ArrayBuffer) return bytes;
  return (bytes.buffer as ArrayBuffer).slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/**
 * 注册自定义字体，供后续 buildParagraph 使用（family 作为文本样式中的 fontFamily）。
 * 可在 CanvasKit 加载前后调用；重复注册同族会替换并重建字体集合。
 */
export function registerFont(family: string, bytes: ArrayBuffer | Uint8Array): void {
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

function colorToInputColor(color: ColorInt): number[] {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
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
      slant: ck.FontSlant.Upright,
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
  return ts;
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
    const [hStyle, wStyle] =
      style == RectStyle.TIGHT
        ? [ck.RectHeightStyle.Tight, ck.RectWidthStyle.Tight]
        : [ck.RectHeightStyle.Max, ck.RectWidthStyle.Max];
    return this.paragraph.getRectsForRange(start, end, hStyle, wStyle).map(it => {
      const r = it.rect;
      return { left: r[0], top: r[1], right: r[2], bottom: r[3] };
    });
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
): PlatformParagraph {
  const ck = getCanvasKit();
  const ps = new ck.ParagraphStyle({
    textAlign: toTextAlign(ck, textAlign),
    textStyle: makeTextStyle(ck),
    maxLines: maxLines !== INT_MAX_VALUE ? maxLines : undefined,
    ellipsis: maxLines !== INT_MAX_VALUE ? ellipsis : undefined,
  });
  const builder = ck.ParagraphBuilder.MakeFromFontCollection(ps, getFontCollection(ck));
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
