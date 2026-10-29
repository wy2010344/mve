import { GetValue, PointKey, StoreRef } from 'wy-helper';
import { ColorInt, colorToCSS, rgba } from '../canvasCore/Draw';
import { roundRectPath } from '../canvasCore/Draw';
import {
  LayoutSize,
  Node2,
  defaultSize,
  innerSize,
  layoutSize,
  merge,
  node2,
  paddingStart,
  tfc,
} from './Node';
import { Node2Arg } from './NodeArg';
import { dragMouse } from './tree/globalMouse';
import { Scroll2, scrollWheel } from './Scroll';

/** 滚动条参数消息（没写的由 [scrollBarDefaults] 兜底） */
export interface ScrollBarArg extends Partial<Node2Arg> {
  /** 滚动状态 */
  scroll: Scroll2;
  /** 轨道厚度（交叉轴外尺寸） */
  thickness?: GetValue<number>;
  /** 轨道背景；null 不画 */
  trackColor?: GetValue<ColorInt | null>;
  /** 滑块背景 */
  thumbColor?: GetValue<ColorInt>;
  /** 滑块圆角（自动钳到半宽/半高） */
  thumbRadius?: GetValue<number>;
}

/** 参数消息的兜底实现 */
export const scrollBarDefaults = {
  thickness: () => 10,
  trackColor: (): ColorInt | null => rgba(0, 0, 0, 15),
  thumbColor: () => rgba(120, 120, 120, 180),
  thumbRadius: () => 5,
};

/** 与 [direction] 垂直的那个轴（滚动条厚度所在轴） */
function crossAxisOf(direction: PointKey): PointKey {
  return direction == 'y' ? 'x' : 'y';
}

/**
 * canvasRender2 版的滚动条（对标旧版 SimpleScrollBar 的子类化用法，
 * 改为工厂 + 参数定制，无需继承）：
 * - 轨道：交叉轴固定厚度，滚动轴尺寸交给父布局（通常 stretch）；
 * - 滑块：尺寸与偏移由 scroll.scrollBarSize 纯派生，不可滚动时尺寸为 0 自然隐身；
 * - 拖拽：mousedown 记录起点，经 globalMouse2 的 move/up 驱动 setValue，
 *   指针移出 canvas 仍能持续拖动（与节点 mouseDown 冒泡派发解耦）。
 *
 * 注意尺寸/位置一律重写 **`size` / `position`**，而不是 `width` / `x`：
 * 布局测量走 `size`、绘制走 `width`（= 由 size 派生），只改后者会让两边对不上。
 *
 * 用法（容器内，与 scrollContent 并列）：`nodeOf(node => scrollBar({ scroll }))`
 */
export const scrollBar = tfc(function (
  ctx,
  ref: StoreRef<Node2>,
  arg: ScrollBarArg
) {
  const p = merge(arg, scrollBarDefaults);
  const d = p.scroll.direction;
  const cross = crossAxisOf(d);
  const calc = () => p.scroll.scrollBarSize(d);

  node2.create(
    merge(
      {
        // 指针落在滚动条上滚轮也该滚（轨道与滑块都算容器的一部分）
        mouseWheel: scrollWheel(p.scroll),
        // 交叉轴固定厚度；滚动轴不指定，走父布局分配。
        // 不可滚动时整条隐藏（含占位厚度），避免"空轨道 + 右侧留白"的怪异空白。
        size(axis: PointKey): LayoutSize {
          if (axis === cross) {
            return layoutSize(
              p.scroll.scrollBarSize(d) ? p.thickness() : 0,
              false
            );
          }
          return defaultSize(ref.get(), axis);
        },
        draw(ctx2: CanvasRenderingContext2D, n: Node2) {
          // 不可滚动：不画轨道（内容没溢出，滚动条无意义，整条隐藏）
          if (!p.scroll.scrollBarSize(d)) return;
          const c = p.trackColor();
          const w = n.width();
          const h = n.height();
          if (c == null || w <= 0 || h <= 0) return;
          ctx2.fillStyle = colorToCSS(c);
          const r = Math.min(p.thickness() / 2, 4);
          if (r > 0) {
            roundRectPath(ctx2, 0, 0, w, h, r);
            ctx2.fill();
          } else {
            ctx2.fillRect(0, 0, w, h);
          }
        },
        children: [
          // 滑块不继承轨道的参数对象（尤其 children，否则会把自己再当子节点）：
          // 它需要的几项（scroll / 颜色 / 圆角）直接经闭包读轨道的 p。
          node2.of({
            // 滚动轴：尺寸/偏移由 scrollBarSize 派生；交叉轴撑满轨道 inner
            size(axis: PointKey): LayoutSize {
              if (axis === d) {
                const c = calc();
                return layoutSize(c ? c.size : 0, true);
              }
              return layoutSize(innerSize(ref.get(), axis), true);
            },
            position(axis: PointKey): number {
              if (axis === d) {
                const c = calc();
                return c ? c.offset : 0;
              }
              // 交叉轴贴轨道起点。
              // 这里**不能**走 defaultPosition(ref.get(), axis)：ref 是**轨道**，
              // 那条路径算出来的是「轨道在容器里的位置」（如 x=360），而 position
              // 消息要的是「滑块相对自己父节点（轨道）的局部坐标」——用了它滑块
              // 会被推到轨道外，表现为"拖拽条怎么都不出现"。
              return paddingStart(ref.get(), axis);
            },
            mouseDown(e) {
              const c = calc();
              if (!c) return;
              const startValue = p.scroll.value();
              const startPointer = d == 'y' ? e.globalY : e.globalX;
              // 拖拽会话（松手自动摘除 move/up 注册，对标旧版 helper/drag）
              dragMouse(ctx, (x, y) => {
                const pointer = d == 'y' ? y : x;
                p.scroll.setValue(
                  startValue + c.moveToScroll(pointer - startPointer)
                );
              });
            },
            draw(ctx2: CanvasRenderingContext2D, self: Node2) {
              const w = self.width();
              const h = self.height();
              if (w <= 0 || h <= 0) return;
              ctx2.fillStyle = colorToCSS(p.thumbColor());
              const r = Math.min(p.thumbRadius(), Math.min(w, h) / 2);
              if (r > 0) {
                roundRectPath(ctx2, 0, 0, w, h, r);
                ctx2.fill();
              } else {
                ctx2.fillRect(0, 0, w, h);
              }
            },
          }),
        ],
      },
      p
    )
  )(ref)(ctx);
});
