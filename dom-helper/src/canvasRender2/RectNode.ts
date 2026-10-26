import { GetValue } from 'wy-helper';
import { ColorInt, colorToCSS } from '../canvasRender/Draw';
import { roundRectPath } from '../canvasRender/LayoutNode';
import { Node2, Node2Arg, node2, tfc } from './Node';

export interface RectNodeArg extends Node2Arg {
  /** 背景色（ColorInt，0xAARRGGBB）；getter 返回 null 表示不填充 */
  background?: GetValue<ColorInt | null>;
  /** 边框色；getter 返回 null 表示不描边 */
  borderColor?: GetValue<ColorInt | null>;
  /** 边框宽度（线宽居中于盒子外沿），默认 1 */
  borderWidth?: GetValue<number>;
  /** 圆角半径，默认 0 */
  radius?: GetValue<number>;
}

/**
 * canvasRender2 版的矩形节点：背景 + 边框 + 圆角的可视化 convenience 节点
 * （对标旧版 renderRect + drawRect/strokeInnerRect 的手工组合）。
 *
 * 绘制语义（贴近 CSS 盒子）：
 * - 背景铺满除边框外的整个盒子（含 padding 区）；
 * - 边框沿盒子外沿描边，线宽居中（内缩 borderWidth/2 保证 crisp）；
 * - radius > 0 时背景与边框都走圆角路径。
 *
 * 用法：nodeOf(node => rectNode({
 *   background: () => 0xfff1f5f9,
 *   borderColor: () => 0xffcbd5e1,
 *   radius: () => 8,
 *   padding: () => 8,
 *   children: [...],
 * }))
 */
export const rectNode = tfc(function (ctx, node, arg: RectNodeArg) {
  const {
    background,
    borderColor,
    borderWidth = () => 1,
    radius = () => 0,
    ...rest
  } = arg;
  node2.create({
    ...rest,
    draw(ctx2: CanvasRenderingContext2D, n) {
      const w = node.width();
      const h = node.height();
      if (w <= 0 || h <= 0) return;
      const bw = borderWidth();
      const bg = background?.() ?? null;
      const bc = borderColor?.() ?? null;
      const hasBorder = bc != null && bw > 0;
      const r = radius();
      // 边框线宽居中：盒子外沿内缩 bw/2
      const [x, y, bw2, bh2] = hasBorder
        ? [bw / 2, bw / 2, Math.max(0, w - bw), Math.max(0, h - bw)]
        : [0, 0, w, h];
      if (bg != null) {
        ctx2.fillStyle = colorToCSS(bg);
        if (r > 0) {
          roundRectPath(ctx2, x, y, bw2, bh2, r);
          ctx2.fill();
        } else {
          ctx2.fillRect(x, y, bw2, bh2);
        }
      }
      if (hasBorder) {
        ctx2.strokeStyle = colorToCSS(bc);
        ctx2.lineWidth = bw;
        if (r > 0) {
          roundRectPath(ctx2, x, y, bw2, bh2, r);
          ctx2.stroke();
        } else {
          ctx2.strokeRect(x, y, bw2, bh2);
        }
      }
      rest.draw?.(ctx2, n);
    },
  })(node)(ctx);
});
