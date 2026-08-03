import { createSignal, emptyArray, memo, ValueOrGet, valueOrGetToGet } from 'wy-helper';
import { StateHolder } from 'mve-core';
import { absolutePosition, Node } from './Node';
import { RectNode, RectNodeArg } from './RectNode';
import { innerSize, layoutSize, LayoutSize } from './LayoutNode';
import { MouseEvent } from './MouseEvent';
import { ColorInt, colorToCSS, rgba } from './Draw';
import { GlobalMouseEvent, engineGlobalContext } from './EngineGlobal';
import {
  buildParagraph,
  INT_MAX_VALUE,
  RectStyle,
  RichTextSpan,
  TextAlign,
} from './PlatformParagraph';
import { drawParagraph } from './CanvasKitLoader';

export interface RichTextNodeArg<T = RichTextNode> extends RectNodeArg<T> {
  spans?: ValueOrGet<RichTextSpan[], T>;
  selectionColor?: ValueOrGet<ColorInt, T>;
  autoWidth?: ValueOrGet<boolean, T>;
  maxLines?: ValueOrGet<number, T>;
  ellipsis?: ValueOrGet<string, T>;
  textAlign?: ValueOrGet<TextAlign, T>;
}

export class RichTextNode extends RectNode {
  spans(): RichTextSpan[] {
    return emptyArray;
  }
  selectionColor(): ColorInt {
    return rgba(100, 100, 200, 60);
  }
  autoWidth(): boolean {
    return false;
  }
  maxLines(): number {
    return INT_MAX_VALUE;
  }
  ellipsis(): string {
    return '\u2026';
  }
  textAlign(): TextAlign {
    return TextAlign.START;
  }

  protected readonly paragraph = memo(() => {
    const ft = this.fullText();
    if (ft.length == 0) return null;
    return buildParagraph(
      this.spans(),
      this.autoWidth() ? Number.MAX_VALUE : innerSize.call(this, 'x'),
      this.maxLines(),
      this.ellipsis(),
      this.textAlign()
    );
  });

  protected anchorIndex = createSignal(-1);
  protected focusIndex = createSignal(-1);

  protected onMouseDown = false;

  constructor(context: StateHolder<Node, readonly Node[]>, args: RichTextNodeArg = {}) {
    super(context, args as any);
    this.spans = valueOrGetToGet(args.spans, this.spans);
    this.selectionColor = valueOrGetToGet(args.selectionColor, this.selectionColor);
    this.autoWidth = valueOrGetToGet(args.autoWidth, this.autoWidth);
    this.maxLines = valueOrGetToGet(args.maxLines, this.maxLines);
    this.ellipsis = valueOrGetToGet(args.ellipsis, this.ellipsis);
    this.textAlign = valueOrGetToGet(args.textAlign, this.textAlign);

    const engineGlobal = context.consume(engineGlobalContext)!;
    const d1 = engineGlobal.registerMouseUp(() => {
      this.onMouseDown = false;
    });
    const absoluteX = memo(() => absolutePosition.call(this, 'x'));
    const absoluteY = memo(() => absolutePosition.call(this, 'y'));
    const d2 = engineGlobal.registerMouseMove((e: GlobalMouseEvent) => {
      if (this.onMouseDown) {
        const p = this.paragraph();
        if (p) {
          this.focusIndex.set(
            p.getGlyphPositionAtCoordinate(
              e.x - absoluteX() - this.paddingInlineStart(),
              e.y - absoluteY() - this.paddingBlockStart()
            )
          );
        }
      }
    });
    context.addDestroy(() => {
      d1();
      d2();
    });
  }

  fullText(): string {
    return this.spans()
      .map(s => s.text)
      .join('');
  }

  argWidth(): LayoutSize {
    if (this.autoWidth()) {
      const p = this.paragraph();
      return layoutSize(p ? p.width() : 0, true);
    }
    return super.argWidth();
  }

  argHeight(): LayoutSize {
    const p = this.paragraph();
    const h = p ? p.height() : this.maxFontSizeInSpans() * 1.4;
    return layoutSize(h, true);
  }

  maxFontSizeInSpans(): number {
    let maxFs = 0;
    for (const span of this.spans()) {
      maxFs = Math.max(maxFs, span.style?.fontSize ?? 0);
    }
    return Math.max(maxFs, 1);
  }

  selectionText(): string | null {
    const a = this.anchorIndex.get();
    const f = this.focusIndex.get();
    if (a < 0 || f < 0 || a == f) return null;
    return this.fullText().substring(Math.min(a, f), Math.max(a, f));
  }

  mouseDown(e: MouseEvent): void {
    const p = this.paragraph();
    if (!p) return;
    const index = p.getGlyphPositionAtCoordinate(
      e.x - this.paddingInlineStart(),
      e.y - this.paddingBlockStart()
    );
    this.anchorIndex.set(index);
    this.focusIndex.set(index);
    this.onMouseDown = true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const p = this.paragraph();
    if (!p) return;

    const a = this.anchorIndex.get();
    const f = this.focusIndex.get();
    if (a >= 0 && f >= 0 && a != f) {
      const selStart = Math.min(a, f);
      const selEnd = Math.max(a, f);
      const rects = p.getRectsForRange(selStart, selEnd, RectStyle.TIGHT);
      ctx.fillStyle = colorToCSS(this.selectionColor());
      for (const rect of rects) {
        ctx.fillRect(
          rect.left + this.paddingInlineStart(),
          rect.top + this.paddingBlockStart(),
          rect.right - rect.left,
          rect.bottom - rect.top
        );
      }
    }

    drawParagraph(p.paragraph, ctx, this.paddingInlineStart(), this.paddingBlockStart());
    super.draw(ctx);
  }
}
