import { ValueOrGet, valueOrGetToGet } from 'wy-helper';
import { StateHolder } from 'mve-core';
import { Node } from './Node';
import { RichTextNode, RichTextNodeArg } from './RichTextNode';
import { ColorInt, rgba } from './Draw';
import { RichTextSpan, RichTextStyle } from './PlatformParagraph';

export enum WordBreak {
  PHRASE = 'PHRASE',
  BREAK_WORD = 'BREAK_WORD',
  ANY_CHAR = 'ANY_CHAR',
}

export interface WrappedTextNodeArg<T = WrappedTextNode> extends RichTextNodeArg<T> {
  text?: ValueOrGet<string, T>;
  fontFamily?: ValueOrGet<string | null, T>;
  fontSize?: ValueOrGet<number, T>;
  fontWeight?: ValueOrGet<number, T>;
  color?: ValueOrGet<ColorInt, T>;
  lineHeightMultiplier?: ValueOrGet<number, T>;
  letterSpacing?: ValueOrGet<number, T>;
  wordSpacing?: ValueOrGet<number, T>;
}

export class WrappedTextNode extends RichTextNode {
  text(): string {
    return '';
  }
  fontFamily(): string | null {
    return null;
  }
  fontSize(): number {
    return 16;
  }
  fontWeight(): number {
    return 400;
  }
  color(): ColorInt {
    return rgba(0, 0, 0);
  }
  lineHeightMultiplier(): number {
    return 1.4;
  }
  letterSpacing(): number {
    return 0;
  }
  wordSpacing(): number {
    return 0;
  }

  constructor(context: StateHolder<Node, readonly Node[]>, args: WrappedTextNodeArg = {}) {
    super(context, args as RichTextNodeArg);
    this.text = valueOrGetToGet(args.text, this.text);
    this.fontFamily = valueOrGetToGet(args.fontFamily, this.fontFamily);
    this.fontSize = valueOrGetToGet(args.fontSize, this.fontSize);
    this.fontWeight = valueOrGetToGet(args.fontWeight, this.fontWeight);
    this.color = valueOrGetToGet(args.color, this.color);
    this.lineHeightMultiplier = valueOrGetToGet(args.lineHeightMultiplier, this.lineHeightMultiplier);
    this.letterSpacing = valueOrGetToGet(args.letterSpacing, this.letterSpacing);
    this.wordSpacing = valueOrGetToGet(args.wordSpacing, this.wordSpacing);
  }

  spans(): RichTextSpan[] {
    const style: RichTextStyle = {
      fontFamily: this.fontFamily(),
      fontSize: this.fontSize(),
      fontWeight: this.fontWeight(),
      color: this.color(),
      letterSpacing: this.letterSpacing(),
      wordSpacing: this.wordSpacing(),
      lineHeightMultiplier: this.lineHeightMultiplier(),
    };
    return [{ text: this.text(), style }];
  }
}
