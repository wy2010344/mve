import { createLateSignal, emptyFun, EmptyFun, PointKey } from 'wy-helper';
import { hookCurrentStateHolder, StateHolder } from 'mve-core';
import {
  Node2,
  Node2Arg,
  absoluteInInner,
  defaultPosition,
  getPadding,
  innerSize,
  node2,
  size,
  tfc,
} from './Node';
import { globalMouse2Context } from './Renderer';

/** 滚动条几何计算：滑块尺寸/偏移与滚动值的双向换算 */
export interface ScrollBarCalculate2 {
  /** 滑块尺寸（沿滚动方向） */
  readonly size: number;
  /** 滑块偏移（沿滚动方向） */
  readonly offset: number;
  /** 最大滚动距离 */
  readonly maxScroll: number;
  /** 滑块最大偏移（轨道长 - 滑块长） */
  readonly maxOffset: number;
  /** 指针位移 → 滚动值增量 */
  moveToScroll(delta: number): number;
  /** 滚动值增量 → 指针位移 */
  scrollToMove(delta: number): number;
}

/** 滚动状态（信号驱动）：值钳制在 [0, maxScroll]，变化经信号通知重绘 */
export interface Scroll2 {
  /** 滚动容器（内容与轨道的父节点） */
  readonly container: Node2;
  /** 滚动方向 */
  readonly direction: PointKey;
  /** 当前滚动值（钳制后） */
  value(): number;
  /** 直接设置（不钳制，读取时钳制） */
  setValue(v: number): void;
  /** 相对滚动，返回真实滚动量 */
  scroll(delta: number): number;
  /** 滚动条几何；不可滚动时返回 undefined */
  scrollBarSize(
    direction: PointKey,
    length?: number
  ): ScrollBarCalculate2 | void;
}

/**
 * 滚动内容节点（对标 Kotlin ScrollContent 子类）：
 * `isScrollContent` 仅是类型标记（对应 Kotlin `it is ScrollContent` 判定），
 * 供 contentSize/maxScroll 从子节点里识别内容；绘制裁剪由节点自身经
 * drawAtParent 钩子完成（对应 Kotlin 的 drawAtParent 重写），基类零感知。
 */
export interface ScrollContentNode2 extends Node2 {
  isScrollContent: true;
}

export function isScrollContentNode(node: Node2): node is ScrollContentNode2 {
  return (node as ScrollContentNode2).isScrollContent === true;
}

/** 内容区尺寸：容器内第一个滚动内容子节点的外尺寸 */
export function contentSize(container: Node2, direction: PointKey): number {
  for (const child of container.children()) {
    if (isScrollContentNode(child)) {
      return size(child, direction);
    }
  }
  return 0;
}

/** 最大可滚动距离：内容尺寸 - 容器 inner 尺寸（负值归零） */
export function maxScroll(container: Node2, direction: PointKey): number {
  return Math.max(
    0,
    contentSize(container, direction) - innerSize(container, direction)
  );
}

/**
 * 创建滚动状态（对标旧版 new Scroll(container, direction)）。
 * 滚动值存放在传入的信号里（默认 createLateSignal(0)），
 * 变化经 wy-helper 信号批处理触发重绘。
 */
export function createScroll(
  container: Node2,
  direction: PointKey = 'y',
  value = createLateSignal(0)
): Scroll2 {
  const get = value.get;
  const set = value.getOnlySet();
  const clamp = (v: number) =>
    Math.min(Math.max(v, 0), maxScroll(container, direction));
  const scroll: Scroll2 = {
    container,
    direction,
    value() {
      return clamp(get());
    },
    setValue(v: number) {
      set(v);
    },
    scroll(delta: number): number {
      const cur = scroll.value();
      const next = clamp(cur + delta);
      const real = next - cur;
      set(next);
      return real;
    },
    scrollBarSize(d: PointKey, length = 0): ScrollBarCalculate2 | void {
      const len = length > 0 ? length : innerSize(container, d);
      const v = innerSize(container, d);
      const c = contentSize(container, d);
      const m = maxScroll(container, d);
      if (m > 0 && c > 0) {
        const thumb = Math.max(20, (len * v) / c);
        const maxOffset = Math.max(0, len - thumb);
        const move = (maxOffset * scroll.value()) / m;
        return {
          size: thumb,
          offset: move,
          maxScroll: m,
          maxOffset,
          moveToScroll(delta: number) {
            return maxOffset > 0 ? (delta * m) / maxOffset : 0;
          },
          scrollToMove(delta: number) {
            return m > 0 ? (delta * maxOffset) / m : 0;
          },
        };
      }
    },
  };
  return scroll;
}

/**
 * 注册滚轮滚动（对标旧版 registerScroll）：
 * 指针落在容器 inner 区内时，按方向消费 deltaY / deltaX。
 * 注销函数同时登记到当前 StateHolder（节点销毁时自动清理），也可手动调用。
 */
export function registerScroll(
  holder: StateHolder<Node2, readonly Node2[]>,
  scroll: Scroll2
): EmptyFun {
  const globalMouse2 = holder.consume(globalMouse2Context);
  if (!globalMouse2) {
    return emptyFun;
  }
  const off = globalMouse2.registerMouseWheel((x, y, deltaX, deltaY) => {
    if (absoluteInInner(scroll.container, x, y)) {
      scroll.scroll(scroll.direction == 'y' ? deltaY : deltaX);
    }
  });
  holder.addDestroy(off);
  return off;
}

export interface ScrollContentArg extends Node2Arg {
  /** 滚动状态：决定内容偏移（滚动轴整体平移 -value）与命中门控 */
  scroll: Scroll2;
}

/**
 * 滚动内容节点（对标旧版 ScrollContent + renderScrollContent）：
 * - drawAtParent 重写：在父坐标系上按容器 inner 区裁剪，内容滚出视口的部分不绘制
 *   （对标 Kotlin ScrollContent.drawAtParent；isScrollContent 仅作类型标记供
 *   contentSize/maxScroll 识别）；
 * - 滚动轴位置恒为 -scroll.value() 叠加容器 padding 起点（交叉轴走默认布局位置）；
 * - acceptClip 把命中测试限制在容器 inner 区内（视口外的子节点不响应事件）。
 *
 * 用法（容器内）：
 *   const scroll = createScroll(container, 'y');
 *   registerScroll(scroll);
 *   nodeOf(node => scrollContent({
 *     scroll,
 *     exts: [grow({ argGrow: 1 })],   // 交叉轴撑满容器
 *     children: [...],                // 可滚动内容
 *   }))
 */
export const scrollContent = tfc(function (ctx, node, arg: ScrollContentArg) {
  const { scroll, position, ...rest } = arg;
  // 类型标记（对应 Kotlin `it is ScrollContent`）：供 contentSize/maxScroll
  // 从容器子节点里识别内容；提前于 node2 挂上（create 返回 TFc，之后无机会）
  (node as ScrollContentNode2).isScrollContent = true;
  node2.create({
    ...rest,
    // 滚动轴位置由 scroll 接管（覆盖用户传入的 position，避免破坏偏移语义）：
    // 容器 inner 原点（父 padding start）减去滚动值
    position(d: PointKey): number {
      if (d === scroll.direction) {
        const parent = node.parent;
        const pad = parent ? getPadding(parent as Node2, d, 'start') : 0;
        return pad - scroll.value();
      }
      return position ? position(d) : defaultPosition(node, d);
    },
    // x/y 相对父（容器）：仅容器 inner 区内可命中
    acceptClip(x: number, y: number): boolean {
      const parent = node.parent;
      if (!parent) return false;
      const p = parent as Node2;
      const left = p.paddingInlineStart();
      const top = p.paddingBlockStart();
      return (
        x > left &&
        x < left + innerSize(p, 'x') &&
        y > top &&
        y < top + innerSize(p, 'y')
      );
    },
    // 父坐标系上的裁剪钩子（对标 Kotlin ScrollContent.drawAtParent 重写）：
    // 由父节点 draw 循环在 translate 前调用，把绘制裁剪到容器 inner 区
    drawAtParent(ctx2: CanvasRenderingContext2D): void {
      const parent = node.parent;
      if (!parent) return;
      const p = parent as Node2;
      ctx2.beginPath();
      ctx2.rect(
        p.paddingInlineStart(),
        p.paddingBlockStart(),
        innerSize(p, 'x'),
        innerSize(p, 'y')
      );
      ctx2.clip();
    },
  })(node)(ctx);
});
