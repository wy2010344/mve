import { createSignal, PointKey } from 'wy-helper';
import { StateHolder } from 'mve-core';
import { Node, absolutePosition } from './Node';
import { RectNode, RectNodeArg } from './RectNode';
import { outerSize, innerSize, paddingStart } from './LayoutNode';
import { engineGlobalContext, GlobalWheelEvent } from './EngineGlobal';
import { inRange } from './util';

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

export interface ScrollContentArg<T = ScrollContent> extends RectNodeArg<T> {}
export class ScrollContent extends RectNode {
  scrollNode: ScrollNode;
  constructor(context: StateHolder<Node>, args: ScrollContentArg) {
    super(context, args as any);
    if (this.parent instanceof ScrollNode) {
      this.scrollNode = this.parent;
    } else {
      throw new Error('父节点必须是ScrollNode');
    }
  }

  x(): number {
    return -this.scrollNode.getScrollX();
  }
  y(): number {
    return -this.scrollNode.getScrollY();
  }
}

export interface ScrollNodeArg<T = ScrollNode> extends RectNodeArg<T> {}
export class ScrollNode extends RectNode {
  signalScrollX = createSignal(0);
  signalScrollY = createSignal(0);

  getScrollX = this.signalScrollX.get;
  getScrollY = this.signalScrollY.get;
  setScrollX = this.signalScrollX.set;
  setScrollY = this.signalScrollY.set;

  override draw(canvas: CanvasRenderingContext2D): void {
    for (const child of this.children()) {
      canvas.save();
      if (child instanceof ScrollContent) {
        canvas.beginPath();
        canvas.rect(
          this.paddingInlineStart(),
          this.paddingBlockStart(),
          innerSize.call(this, 'x'),
          innerSize.call(this, 'y')
        );
        canvas.clip();
      }
      canvas.translate(child.x(), child.y());
      child.draw(canvas);
      canvas.restore();
    }
  }

  scrollDelta(delta: number, d: PointKey): number {
    const next = Math.min(
      Math.max(getScroll.call(this, d) + delta, 0),
      maxScroll.call(this, d)
    );
    const realDelta = next - getScroll.call(this, d);
    setScroll.call(this, d, next);
    return realDelta;
  }

  constructor(context: StateHolder<Node>, args: ScrollNodeArg) {
    super(context, args as any);
    const engineGlobal = context.consume(engineGlobalContext)!;
    const d0 = engineGlobal.registerMouseWheel((e: GlobalWheelEvent) => {
      if (
        inRange(
          absolutePosition.call(this, 'x') + paddingStart.call(this, 'x'),
          e.x,
          innerSize.call(this, 'x')
        ) &&
        inRange(
          absolutePosition.call(this, 'y') + paddingStart.call(this, 'y'),
          e.y,
          innerSize.call(this, 'y')
        )
      ) {
        this.scrollDelta(e.deltaX, 'x');
        this.scrollDelta(e.deltaY, 'y');
      }
    });
    context.addDestroy(d0);
  }
}

function getScroll(this: ScrollNode, d: PointKey) {
  if (d == 'x') {
    return this.getScrollX();
  }
  return this.getScrollY();
}
function setScroll(this: ScrollNode, d: PointKey, v: number) {
  if (d == 'x') {
    return this.setScrollX(v);
  }
  return this.setScrollY(v);
}
export function scrollBarSize(
  this: ScrollNode,
  direction: PointKey,
  length: number = 0
): ScrollBarCalculate | void {
  const len = length > 0 ? length : innerSize.call(this, direction);
  const v = innerSize.call(this, direction);
  const c = contentSize.call(this, direction);
  const m = maxScroll.call(this, direction);
  if (m > 0) {
    const thumb = Math.max(20, (len * v) / c);
    const maxOffset = len - thumb;
    const move = (maxOffset * getScroll.call(this, direction)) / m;
    return new ScrollBarCalculate(thumb, move, m, maxOffset);
  }
}

function contentSize(this: ScrollNode, direction: PointKey): number {
  for (const child of this.children()) {
    if (child instanceof ScrollContent) {
      return outerSize.call(child, direction);
    }
  }
  return 0;
}

function maxScroll(this: ScrollNode, direction: PointKey): number {
  return Math.max(
    0,
    contentSize.call(this, direction) - innerSize.call(this, direction)
  );
}
