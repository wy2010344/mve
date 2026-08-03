import { memo, ValueOrGet, valueOrGetToGet } from 'wy-helper';
import { StateHolder } from 'mve-core';
import { Node } from './Node';
import { RectNode, RectNodeArg } from './RectNode';
import { LayoutSize, LayoutSizeDirection, layoutSize, padding, roundRectPath } from './LayoutNode';
import { PlatformImage } from './PlatformImage';

export interface ImageNodeArg<T = ImageNode> extends RectNodeArg<T> {
  image?: ValueOrGet<PlatformImage | null, T>;
  originalWidth?: ValueOrGet<number, T>;
  originalHeight?: ValueOrGet<number, T>;
  radius?: ValueOrGet<number, T>;
  imageSize?: ValueOrGet<LayoutSizeDirection | null, T>;
}

export class ImageNode extends RectNode {
  image(): PlatformImage | null {
    return null;
  }
  originalWidth(): number {
    return this.image()?.width ?? 0;
  }
  originalHeight(): number {
    return this.image()?.height ?? 0;
  }
  radius(): number {
    return 0;
  }
  imageSize(): LayoutSizeDirection | null {
    return null;
  }

  protected readonly contentSize = memo<readonly [number, number]>(
    (): readonly [number, number] => {
      const img = this.image();
      if (!img) return [0, 0];
      const padX = padding.call(this, 'x', 'start') + padding.call(this, 'x', 'end');
      const padY = padding.call(this, 'y', 'start') + padding.call(this, 'y', 'end');
      const ow = Math.max(1, this.originalWidth());
      const oh = Math.max(1, this.originalHeight());
      const s = this.imageSize();
      if (!s) return [this.originalWidth(), this.originalHeight()];
      if (s.direction == 'x') {
        const w = s.fromInside ? s.value : Math.max(0, s.value - padX);
        return [w, (w * oh) / ow];
      }
      const h = s.fromInside ? s.value : Math.max(0, s.value - padY);
      return [(h * ow) / oh, h];
    }
  );

  constructor(context: StateHolder<Node, readonly Node[]>, args: ImageNodeArg = {}) {
    super(context, args as any);
    this.image = valueOrGetToGet(args.image, this.image);
    this.originalWidth = valueOrGetToGet(args.originalWidth, this.originalWidth);
    this.originalHeight = valueOrGetToGet(args.originalHeight, this.originalHeight);
    this.radius = valueOrGetToGet(args.radius, this.radius);
    this.imageSize = valueOrGetToGet(args.imageSize, this.imageSize);
  }

  argWidth(): LayoutSize {
    return layoutSize(this.contentSize()[0], true);
  }

  argHeight(): LayoutSize {
    return layoutSize(this.contentSize()[1], true);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const img = this.image();
    if (img) {
      const [w, h] = this.contentSize();
      if (w > 0 && h > 0) {
        const ox = this.paddingInlineStart();
        const oy = this.paddingBlockStart();
        const r = this.radius();
        if (r > 0) {
          ctx.save();
          roundRectPath(ctx, ox, oy, w, h, r);
          ctx.clip();
          ctx.drawImage(img.source, ox, oy, w, h);
          ctx.restore();
        } else {
          ctx.drawImage(img.source, ox, oy, w, h);
        }
      }
    }
    super.draw(ctx);
  }
}
