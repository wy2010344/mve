import {
  GetValue,
  memo,
  PointKey,
  ValueOrGet,
  valueOrGetToGet,
} from 'wy-helper';
import { PlatformImage } from '../canvasRender/PlatformImage';
import { roundRectPath } from '../canvasRender/LayoutNode';
import {
  LayoutSize,
  LayoutSizeDirection,
  Node2,
  Node2Arg,
  alaways0,
  layoutSize,
  node2,
  tfc,
} from './Node';

export interface ImageNodeArg extends Node2Arg {
  /** 图片源，支持直接传值或传 getter（如信号） */
  image?: GetValue<PlatformImage>;
  /** 原图宽度，默认取图片自身宽度 */
  originalWidth?: GetValue<number>;
  /** 原图高度，默认取图片自身高度 */
  originalHeight?: GetValue<number>;
  /** 圆角半径，默认 0 */
  radius?: GetValue<number>;
  /** 单方向尺寸约束，另一方向按原图比例推算；为空时使用原图尺寸 */
  imageSize?: GetValue<LayoutSizeDirection | null>;
}

/**
 * canvasRender2 版的图片节点。
 * 尺寸由图片内容推导（可用 imageSize 约束单边、按比例推算另一边），
 * 绘制时支持圆角裁剪，内容绘制在 padding 之内。
 * 用法：nodeOf(node => imageNode({ image, ... }))
 */
export const imageNode = tfc(function (ctx, node, arg: ImageNodeArg) {
  const {
    image,
    originalWidth,
    originalHeight,
    radius = alaways0,
    imageSize,
    ...rest
  } = arg;
  /** 图片内容尺寸（不含 padding），带信号缓存 */
  const contentSize = memo<readonly [number, number]>(
    (): readonly [number, number] => {
      const img = image?.();
      if (!img) return [0, 0];
      const padX = node.paddingInlineStart() + node.paddingInlineEnd();
      const padY = node.paddingBlockStart() + node.paddingBlockEnd();
      // 比例换算的除数兜底为 1（对标 Kotlin originalWidth.coerceAtLeast(1f)），
      // 避免 0 宽/0 高的图片源算出 Infinity/NaN 尺寸
      const ow = Math.max(1, img.width);
      const oh = Math.max(1, img.height);
      const s = imageSize?.();
      if (!s) {
        return [img.width, img.height];
      }
      if (s.direction == 'x') {
        const w = s.fromInside ? s.value : Math.max(0, s.value - padX);
        return [w, (w * img.height) / ow];
      }
      const h = s.fromInside ? s.value : Math.max(0, s.value - padY);
      return [(h * img.width) / oh, h];
    }
  );

  //图片节点的尺寸恒由图片内容推导，外部传入的 size 不生效
  node2.create({
    ...rest,
    size(d: PointKey): LayoutSize {
      return layoutSize(contentSize()[d === 'x' ? 0 : 1], true);
    },
    draw(ctx2: CanvasRenderingContext2D) {
      const img = image?.();
      if (!img) return;
      const [w, h] = contentSize();
      if (w <= 0 || h <= 0) return;
      const ox = node.paddingInlineStart();
      const oy = node.paddingBlockStart();
      const r = radius();
      if (r > 0) {
        ctx2.save();
        roundRectPath(ctx2, ox, oy, w, h, r);
        ctx2.clip();
        ctx2.drawImage(img.source, ox, oy, w, h);
        ctx2.restore();
      } else {
        ctx2.drawImage(img.source, ox, oy, w, h);
      }
    },
  })(node)(ctx);
});
