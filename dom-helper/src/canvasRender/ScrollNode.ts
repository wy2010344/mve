import { createSignal, memo, LayoutFun } from 'wy-helper';
import { StateHolder } from 'mve-core';
import { Direction, Node, absolutePosition } from './Node';
import { RectNode } from './RectNode';
import {
  LayoutSize,
  StartEnd,
  LayoutNode,
  absoluteLayout,
  sizeFromParent,
} from './layout/LayoutNode';
import { engineGlobalContext } from './EngineGlobal';
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

abstract class ContentClass extends RectNode {}

export class ScrollNode extends RectNode {
  private scrollX = createSignal(0);
  private scrollY = createSignal(0);

  scroll(direction: Direction): number {
    return direction === Direction.x ? this.scrollX.get() : this.scrollY.get();
  }

  override layout(_d: Direction): LayoutFun<LayoutNode> {
    return absoluteLayout();
  }

  override size(direction: Direction): LayoutSize {
    const lp = this.layoutParent();
    if (lp) {
      try {
        const v = lp.layoutValue(direction).childSize(this.layoutIndex());
        return sizeFromParent(v, false);
      } catch (_e) {}
    }
    return sizeFromParent(0, false);
  }

  contentSize(direction: Direction): number {
    for (const child of this.children()) {
      if (child instanceof ContentClass) {
        return child.outerSize(direction);
      }
    }
    return 0;
  }

  maxScroll(direction: Direction): number {
    return this.contentSize(direction) - this.innerSize(direction);
  }

  override draw(canvas: CanvasRenderingContext2D): void {
    this.drawSelf(canvas);
    for (const child of this.children()) {
      canvas.save();
      if (child instanceof ContentClass) {
        canvas.beginPath();
        canvas.rect(
          this.padding(Direction.x, StartEnd.start),
          this.padding(Direction.y, StartEnd.start),
          this.innerSize(Direction.x),
          this.innerSize(Direction.y)
        );
        canvas.clip();
      }
      canvas.translate(
        child.position(Direction.x),
        child.position(Direction.y)
      );
      child.draw(canvas);
      canvas.restore();
    }
  }

  scrollBarSize(
    direction: Direction,
    length: number = 0
  ): ScrollBarCalculate | null {
    const len = length > 0 ? length : this.innerSize(direction);
    const v = this.innerSize(direction);
    const c = this.contentSize(direction);
    const m = this.maxScroll(direction);
    if (m > 0) {
      const thumb = Math.max(20, (len * v) / c);
      const maxOffset = len - thumb;
      const move = (maxOffset * this.scroll(direction)) / m;
      return new ScrollBarCalculate(thumb, move, m, maxOffset);
    }
    return null;
  }

  private absX(): number {
    return absolutePosition(this, Direction.x);
  }

  private absY(): number {
    return absolutePosition(this, Direction.y);
  }

  scrollDelta(delta: number): number {
    const next = Math.min(
      Math.max(this.scrollY.get() + delta, 0),
      this.maxScroll(Direction.y)
    );
    const realDelta = next - this.scrollY.get();
    this.scrollY.set(next);
    return realDelta;
  }

  constructor(context: StateHolder<Node>, args: Partial<ScrollNode>) {
    super(context, args);
    const engineGlobal = context.consume(engineGlobalContext)!;
    const d0 = engineGlobal.registerMouseWheel(
      (e: import('./EngineGlobal').GlobalWheelEvent) => {
        if (
          inRange(
            this.absX() + this.innerStart(Direction.x),
            e.x,
            this.innerSize(Direction.x)
          ) &&
          inRange(
            this.absY() + this.innerStart(Direction.y),
            e.y,
            this.innerSize(Direction.y)
          )
        ) {
          this.scrollDelta(e.delta);
        }
      }
    );
    context.addDestroy(d0);
  }

  provideContentSize(_direction: Direction): LayoutSize | null {
    return null;
  }

  contentLayout(_direction: Direction): LayoutFun<LayoutNode> {
    return absoluteLayout();
  }

  contentPadding(_direction: Direction, _startEnd: StartEnd): number {
    return 0;
  }

  protected buildContentChildren(): void {}

  override buildChildren(): void {
    this.buildScrollNode();
  }

  private callTime = 0;

  private buildScrollNode(): void {
    if (this.callTime > 0) {
      throw new Error('只允许调用一次');
    }
    this.callTime = 1;
    const self = this;
    const context = this.context;

    // Create ContentClass as a child of this ScrollNode
    // The ContentClass constructor calls context.renderNode, adding it as a child
    new (class extends ContentClass {
      override layout(direction: Direction): LayoutFun<LayoutNode> {
        return self.contentLayout(direction);
      }

      override padding(direction: Direction, startEnd: StartEnd): number {
        return self.contentPadding(direction, startEnd);
      }

      override position(d: Direction): number {
        return (
          self.innerStart(d) +
          (d === Direction.x
            ? -self.scroll(Direction.x)
            : -self.scroll(Direction.y))
        );
      }

      override size(direction: Direction): LayoutSize {
        return (
          self.provideContentSize(direction) ?? self.sizeFromChildren(direction)
        );
      }

      override buildChildren(): void {
        self.buildContentChildren();
      }
    })(context);
  }
}
