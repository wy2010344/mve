import { emptyFun, GetValue, StoreRef } from 'wy-helper';
import { ColorInt, colorToCSS } from '../canvasCore/Draw';
import { roundRectPath } from '../canvasCore/Draw';
import { fc, merge, Node2, node2 } from './Node';
import { Node2Arg } from './NodeArg';

/**
 * 矩形节点的参数消息（没写的由 [rectNodeDefaults] 兜底）。
 *
 * 与 ooc 一一对应：ooc 里没有"可选成员"，所以参数对象永远配一份 defaults，
 * `p = merge $ arg defaults` 之后 `p background` / `p radius` 一定答得出来。
 */
export interface RectNodeArg extends Partial<Node2Arg> {
  /** 背景色（ColorInt，0xAARRGGBB）；返回 null 表示不填充 */
  background?: GetValue<ColorInt | null>;
  /** 边框色；返回 null 表示不描边 */
  borderColor?: GetValue<ColorInt | null>;
  /** 边框宽度（线宽居中于盒子外沿） */
  borderWidth?: GetValue<number>;
  /** 圆角半径 */
  radius?: GetValue<number>;
}

/** 参数消息的兜底实现（ooc: 顶层 `rectDefaults = { … }`） */
export const rectNodeDefaults = {
  background: (): ColorInt | null => null,
  borderColor: (): ColorInt | null => null,
  borderWidth: () => 1,
  radius: () => 0,
  /** 用户自己的绘制回调（默认什么都不画） */
  draw: emptyFun as (ctx2: CanvasRenderingContext2D, n: Node2) => void,
};

/**
 * canvasRender2 版的矩形节点：背景 + 边框 + 圆角的可视化 convenience 节点
 * （对标旧版 renderRect + drawRect/strokeInnerRect 的手工组合）。
 *
 * 绘制语义（贴近 CSS 盒子）：
 * - 背景铺满除边框外的整个盒子（含 padding 区）；
 * - 边框沿盒子外沿描边，线宽居中（内缩 borderWidth/2 保证 crisp）；
 * - radius > 0 时背景与边框都走圆角路径。
 *
 * 装配三步（与 ooc 同形）：
 * ```ooc
 * p = merge $ arg rectNodeDefaults;      // 参数 + 兜底
 * n = merge $ { draw { … } } p;          // 节点自有消息优先
 * node2 create n
 * ```
 *
 * 用法：`nodeOf(node => rectNode({ background: () => 0xfff1f5f9, radius: () => 8, nodeRef: node }))`
 */
export const rectNode = fc(function (ctx, arg: RectNodeArg) {
  const p = merge(arg, rectNodeDefaults);
  node2(
    merge(
      {
        draw(ctx2: CanvasRenderingContext2D, n: Node2) {
          const w = n.width();
          const h = n.height();
          if (w <= 0 || h <= 0) return;
          const bw = p.borderWidth();
          const bg = p.background();
          const bc = p.borderColor();
          const hasBorder = bc != null && bw > 0;
          const r = p.radius();
          // 边框线宽居中：盒子外沿内缩 bw/2
          const x = hasBorder ? bw / 2 : 0;
          const y = hasBorder ? bw / 2 : 0;
          const boxW = hasBorder ? Math.max(0, w - bw) : w;
          const boxH = hasBorder ? Math.max(0, h - bw) : h;
          if (bg != null) {
            ctx2.fillStyle = colorToCSS(bg);
            if (r > 0) {
              roundRectPath(ctx2, x, y, boxW, boxH, r);
              ctx2.fill();
            } else {
              ctx2.fillRect(x, y, boxW, boxH);
            }
          }
          if (hasBorder) {
            ctx2.strokeStyle = colorToCSS(bc);
            ctx2.lineWidth = bw;
            if (r > 0) {
              roundRectPath(ctx2, x, y, boxW, boxH, r);
              ctx2.stroke();
            } else {
              ctx2.strokeRect(x, y, boxW, boxH);
            }
          }
          // 用户回调（默认空实现）：发消息即可，不必判断有没有
          p.draw(ctx2, n);
        },
      },
      p
    )
  )(ctx);
});
