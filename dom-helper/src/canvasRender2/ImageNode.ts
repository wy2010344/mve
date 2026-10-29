import { GetValue, memo, PointKey, StoreRef } from 'wy-helper';
import { PlatformImage } from '../canvasCore/Image';
import { roundRectPath } from '../canvasCore/Draw';
import {
  LayoutSize,
  LayoutSizeDirection,
  Node2,
  layoutSize,
  merge,
  node2,
  tfc,
} from './Node';
import { Node2Arg } from './NodeArg';

/**
 * 图片节点的参数消息（没写的由 [imageNodeDefaults] 兜底）。
 * `originalWidth` / `originalHeight` 已删除：尺寸一律取图片自身的
 * `width` / `height`，多两个参数只会让调用方猜「到底哪个生效」。
 */
export interface ImageNodeArg extends Partial<Node2Arg> {
  /** 图片源（可传信号 / getter） */
  image?: GetValue<PlatformImage | null>;
  /** 圆角半径 */
  radius?: GetValue<number>;
  /** 单方向尺寸约束，另一方向按原图比例推算；为 null 时使用原图尺寸 */
  imageSize?: GetValue<LayoutSizeDirection | null>;
}

/** 参数消息的兜底实现 */
export const imageNodeDefaults = {
  image: (): PlatformImage | null => null,
  radius: () => 0,
  imageSize: (): LayoutSizeDirection | null => null,
};

/**
 * canvasRender2 版的图片节点。
 *
 * 尺寸恒由图片内容推导（`imageSize` 可约束单边、另一边按比例推算），
 * 外部传入的 `size` 不生效；绘制时支持圆角裁剪，内容画在 padding 之内。
 *
 * 用法：`nodeOf(node => imageNode({ image, radius: () => 8 }))`
 */
export const imageNode = tfc(function (
  ctx,
  ref: StoreRef<Node2>,
  arg: ImageNodeArg
) {
  const p = merge(arg, imageNodeDefaults);

  /** 图片内容尺寸（不含 padding），带信号缓存 */
  const contentSize = memo<readonly [number, number]>(
    (): readonly [number, number] => {
      const img = p.image();
      if (!img) return [0, 0];
      const node = ref.get();
      const padX = node.paddingInlineStart() + node.paddingInlineEnd();
      const padY = node.paddingBlockStart() + node.paddingBlockEnd();
      // 比例换算的除数兜底为 1（对标 Kotlin originalWidth.coerceAtLeast(1f)），
      // 避免 0 宽/0 高的图片源算出 Infinity/NaN 尺寸
      const ow = Math.max(1, img.width);
      const oh = Math.max(1, img.height);
      const s = p.imageSize();
      if (!s) return [img.width, img.height];
      if (s.direction == 'x') {
        const w = s.fromInside ? s.value : Math.max(0, s.value - padX);
        return [w, (w * img.height) / ow];
      }
      const h = s.fromInside ? s.value : Math.max(0, s.value - padY);
      return [(h * img.width) / oh, h];
    }
  );

  node2.create(
    merge(
      {
        size(d: PointKey): LayoutSize {
          const s = contentSize();
          return layoutSize(d === 'x' ? s[0] : s[1], true);
        },
        draw(ctx2: CanvasRenderingContext2D, node: Node2) {
          const img = p.image();
          if (!img) return;
          const s = contentSize();
          const w = s[0];
          const h = s[1];
          if (w <= 0 || h <= 0) return;
          const ox = node.paddingInlineStart();
          const oy = node.paddingBlockStart();
          const r = p.radius();
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
      },
      p
    )
  )(ref)(ctx);
});
