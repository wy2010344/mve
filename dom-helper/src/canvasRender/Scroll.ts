import { createLateSignal, OneSetStoreRef, PointKey } from 'wy-helper';
import { hookCurrentStateHolder, StateHolder } from 'mve-core';
import { Node } from './Node';
import { RectNode, RectNodeArg } from './RectNode';
import {
  absoluteInInner,
  innerSize,
  LayoutNode,
  outerSize,
} from './LayoutNode';
import { engineGlobalContext, GlobalWheelEvent } from './EngineGlobal';

export class ScrollBarCalculate {
  constructor(
    readonly size: number,
    readonly offset: number,
    readonly maxScroll: number,
    readonly maxOffset: number
  ) {}

  moveToScroll(delta: number): number {
    return (delta * this.maxScroll) / this.maxOffset;
  }

  scrollToMove(delta: number): number {
    return (delta * this.maxOffset) / this.maxScroll;
  }
}

export class Scroll {
  private readonly setSignal: (v: number) => number;
  private readonly getSignal: () => number;

  constructor(
    readonly container: LayoutNode,
    readonly direction: PointKey = 'y',
    value: OneSetStoreRef<number> = createLateSignal(0)
  ) {
    this.setSignal = value.getOnlySet();
    this.getSignal = value.get;
  }

  value(): number {
    return Math.min(Math.max(this.getSignal(), 0), maxScroll.call(this.container, this.direction));
  }

  setValue(v: number): void {
    this.setSignal(v);
  }

  scroll(delta: number): number {
    const cur = this.value();
    const next = Math.min(Math.max(cur + delta, 0), maxScroll.call(this.container, this.direction));
    const realDelta = next - cur;
    this.setSignal(next);
    return realDelta;
  }

  /**
   * length 滚动的长度
   * return <尺寸，位置>
   */
  scrollBarSize(direction: PointKey, length: number = 0): ScrollBarCalculate | void {
    const len = length > 0 ? length : innerSize.call(this.container, direction);
    const v = innerSize.call(this.container, direction);
    const c = contentSize.call(this.container, direction);
    const m = maxScroll.call(this.container, direction);
    if (m > 0) {
      const thumb = Math.max(20, (len * v) / c);
      const maxOffset = len - thumb;
      const move = (maxOffset * this.value()) / m;
      return new ScrollBarCalculate(thumb, move, m, maxOffset);
    }
  }
}

export function registerScroll(scroll: Scroll): void {
  const context = hookCurrentStateHolder(true);
  const engineGlobal = context.consume(engineGlobalContext)!;
  const d0 = engineGlobal.registerMouseWheel((e: GlobalWheelEvent) => {
    if (absoluteInInner.call(scroll.container, e.x, e.y)) {
      if (scroll.direction == 'y') {
        scroll.scroll(e.deltaY);
      } else {
        scroll.scroll(e.deltaX);
      }
    }
  });
  context.addDestroy(d0);
}

/**
 * 最大可滚动
 */
export function maxScroll(this: LayoutNode, direction: PointKey): number {
  return Math.max(0, contentSize.call(this, direction) - innerSize.call(this, direction));
}

/**
 * 内容区尺寸
 */
export function contentSize(this: LayoutNode, direction: PointKey): number {
  for (const child of this.children()) {
    if (child instanceof ScrollContent) {
      return outerSize.call(child, direction);
    }
  }
  return 0;
}

export interface ScrollContentArg<T = ScrollContent> extends RectNodeArg<T> {}
export class ScrollContent extends RectNode {
  isScrollContent = true;

  constructor(context: StateHolder<Node, readonly Node[]>, args: ScrollContentArg) {
    super(context, args as any);
  }

  acceptClip(x: number, y: number): boolean {
    const sn = this.layoutParent!;
    const left = sn.paddingInlineStart();
    const top = sn.paddingBlockStart();
    const right = left + innerSize.call(sn, 'x');
    const bottom = top + innerSize.call(sn, 'y');
    return x > left && x < right && y > top && y < bottom;
  }
}
