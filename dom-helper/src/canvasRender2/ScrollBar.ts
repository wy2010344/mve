import { GetValue, PointKey } from 'wy-helper';
import { ColorInt, colorToCSS, rgba } from '../canvasRender/Draw';
import { roundRectPath } from '../canvasRender/LayoutNode';
import { Node2, Node2Arg, innerSize, node2, tfc } from './Node';
import { dragMouse } from './Renderer';
import { Scroll2 } from './Scroll';

export interface ScrollBarArg extends Node2Arg {
  /** 滚动状态 */
  scroll: Scroll2;
  /** 轨道厚度（交叉轴外尺寸），默认 10 */
  thickness?: GetValue<number>;
  /** 轨道背景，null 不画；默认 rgba(0, 0, 0, 15) */
  trackColor?: GetValue<ColorInt | null>;
  /** 滑块背景，默认 rgba(120, 120, 120, 180) */
  thumbColor?: GetValue<ColorInt>;
  /** 滑块圆角（自动钳到半宽/半高），默认 5 */
  thumbRadius?: GetValue<number>;
}

/**
 * canvasRender2 版的滚动条（对标旧版 SimpleScrollBar 的子类化用法，
 * 改为工厂 + 参数定制，无需继承）：
 * - 轨道：交叉轴固定厚度，滚动轴尺寸交给父布局（通常 stretch）；
 * - 滑块：尺寸与偏移由 scroll.scrollBarSize 纯派生，不可滚动时尺寸为 0 自然隐身；
 * - 拖拽：mousedown 记录起点，经 globalMouse2 的 move/up 驱动 setValue，
 *   指针移出 canvas 仍能持续拖动（与节点 mouseDown 冒泡派发解耦）。
 *
 * 用法（容器内，与 scrollContent 并列）：
 *   nodeOf(node => scrollBar({ scroll }))
 */
export const scrollBar = tfc(function (ctx, node, arg: ScrollBarArg) {
  const {
    scroll,
    thickness = () => 10,
    trackColor = () => rgba(0, 0, 0, 15),
    thumbColor = () => rgba(120, 120, 120, 180),
    thumbRadius = () => 5,
    ...rest
  } = arg;
  const d = scroll.direction;
  const calc = () => scroll.scrollBarSize(d);
  node2.create({
    ...rest,
    // 交叉轴固定厚度；滚动轴不传尺寸，走 node2 默认（父布局分配）
    width: d == 'y' ? () => thickness() : undefined,
    height: d == 'x' ? () => thickness() : undefined,
    draw(ctx2: CanvasRenderingContext2D) {
      const c = trackColor();
      const w = node.width();
      const h = node.height();
      if (c == null || w <= 0 || h <= 0) return;
      ctx2.fillStyle = colorToCSS(c);
      const r = Math.min(thickness() / 2, 4);
      if (r > 0) {
        roundRectPath(ctx2, 0, 0, w, h, r);
        ctx2.fill();
      } else {
        ctx2.fillRect(0, 0, w, h);
      }
    },
    children: [
      node2.of({
        // 滚动轴：尺寸/偏移由 scrollBarSize 派生；交叉轴撑满轨道 inner
        width: d == 'x' ? () => calc()?.size ?? 0 : () => innerSize(node, 'x'),
        height: d == 'y' ? () => calc()?.size ?? 0 : () => innerSize(node, 'y'),
        x: d == 'x' ? () => calc()?.offset ?? 0 : undefined,
        y: d == 'y' ? () => calc()?.offset ?? 0 : undefined,
        mouseDown(e) {
          const c = calc();
          if (!c) return;
          const startValue = scroll.value();
          const startPointer = d == 'y' ? e.globalY : e.globalX;
          // 拖拽会话（松手自动摘除 move/up 注册，对标旧版 helper/drag）
          dragMouse(ctx, (x, y) => {
            const pointer = d == 'y' ? y : x;
            scroll.setValue(
              startValue + c.moveToScroll(pointer - startPointer)
            );
          });
        },
        draw(ctx2: CanvasRenderingContext2D, self: Node2) {
          const w = self.width();
          const h = self.height();
          if (w <= 0 || h <= 0) return;
          ctx2.fillStyle = colorToCSS(thumbColor());
          const r = Math.min(thumbRadius(), Math.min(w, h) / 2);
          if (r > 0) {
            roundRectPath(ctx2, 0, 0, w, h, r);
            ctx2.fill();
          } else {
            ctx2.fillRect(0, 0, w, h);
          }
        },
      }),
    ],
  })(node)(ctx);
});
