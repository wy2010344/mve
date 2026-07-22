import { StateHolder } from 'mve-core';
import {
  Layout,
  AlignSelfFun,
  LayoutFun,
  memo,
  absoluteLayoutFun,
  ValueOrGet,
  PointKey,
  emptyArray,
  valueOrGetToGet,
  LayoutInsideObject,
} from 'wy-helper';
import { Node, NodeArg } from './Node';

export type { Layout, LayoutFun };

// ---------------------------------------------------------------------------
// LayoutNode — the engine's node that participates in layout
// ---------------------------------------------------------------------------

export interface LayoutDirection {
  layout(d: PointKey): LayoutFun<LayoutNode>;
}
export interface LayoutNodeArg<T = LayoutNode> extends NodeArg<T> {
  padding?: ValueOrGet<number, T, [PointKey, StartEnd]>;
  paddingInline?: ValueOrGet<number, T, [StartEnd]>;
  paddingBlock?: ValueOrGet<number, T, [StartEnd]>;
  paddingInlineStart?: ValueOrGet<number, T>;
  paddingInlineEnd?: ValueOrGet<number, T>;
  paddingBlockStart?: ValueOrGet<number, T>;
  paddingBlockEnd?: ValueOrGet<number, T>;
  size?: ValueOrGet<LayoutSize, T, [PointKey]>;
  width?: ValueOrGet<LayoutSize, T>;
  height?: ValueOrGet<LayoutSize, T>;
  layout?: ValueOrGet<LayoutDirection, T>;
  grow?: ValueOrGet<number, T>;
  align?: ValueOrGet<AlignSelfFun, T>;
}
export class LayoutNode extends Node {
  isLayout(): this is LayoutNode {
    return true;
  }
  constructor(
    context: StateHolder<Node> | void,
    args: LayoutNodeArg,
    parent?: Node
  ) {
    super(context, args as any, parent);

    this.argPadding = valueOrGetToGet(args.padding, this.argPadding);
    this.argPaddingBlock = valueOrGetToGet(
      args.paddingBlock,
      this.argPaddingBlock
    );
    this.argPaddingInline = valueOrGetToGet(
      args.paddingInline,
      this.argPaddingInline
    );
    this.paddingBlockStart = valueOrGetToGet(
      args.paddingBlockStart,
      this.paddingBlockStart
    );
    this.paddingBlockEnd = valueOrGetToGet(
      args.paddingBlockEnd,
      this.paddingBlockEnd
    );
    this.paddingInlineStart = valueOrGetToGet(
      args.paddingInlineStart,
      this.paddingInlineStart
    );
    this.paddingInlineEnd = valueOrGetToGet(
      args.paddingInlineEnd,
      this.paddingInlineEnd
    );

    this.argSize = valueOrGetToGet(args.size, this.argSize);
    this.argWidth = valueOrGetToGet(args.width, this.argWidth);
    this.argHeight = valueOrGetToGet(args.height, this.argHeight);
    this.grow = valueOrGetToGet(args.grow, this.grow);
    this.align = valueOrGetToGet(args.align, this.align);
    if (args.layout) {
      if (typeof args.layout == 'function') {
        this.layout = args.layout.call(this);
      } else {
        this.layout = args.layout;
      }
    }
  }

  argPadding(d: PointKey, s: StartEnd) {
    return 0;
  }
  argPaddingInline(s: StartEnd) {
    return this.argPadding('x', s);
  }
  argPaddingBlock(s: StartEnd) {
    return this.argPadding('y', s);
  }
  paddingInlineStart() {
    return this.argPaddingInline('start');
  }
  paddingInlineEnd() {
    return this.argPaddingInline('end');
  }
  paddingBlockStart() {
    return this.argPaddingBlock('start');
  }
  paddingBlockEnd() {
    return this.argPaddingBlock('end');
  }
  argSize(d: PointKey): LayoutSize {
    return 0;
  }
  argWidth() {
    return this.argSize('x');
  }
  argHeight() {
    return this.argSize('x');
  }

  layout: LayoutDirection = {
    layout(d) {
      return absoluteLayoutFun;
    },
  };
  grow(): number {
    return 0;
  }
  align(): AlignSelfFun | void {}
  layoutParent: LayoutNode | void = undefined;
  layoutChildren = memo<readonly LayoutNode[]>(() => {
    return this.children().filter(n => n.isLayout());
  });
  _layoutIndex = 0;
  layoutIndex(): number {
    this.layoutParent?.layoutChildren();
    return this._layoutIndex;
  }
  acceptHit(x: number, y: number): boolean {
    const w = outerSize.call(this, 'x');
    const h = outerSize.call(this, 'y');
    return x > 0 && y > 0 && x < w && y < h;
  }

  private createLayout(d: PointKey) {
    const inside: LayoutInsideObject<LayoutNode> = {
      children: this.layoutChildren,
      innerSize: () => {
        return innerSize.call(this, d);
      },
    };
    return memo(() => {
      return this.layout.layout(d).createLayout(inside);
    });
  }
  layoutX = this.createLayout('x');
  layoutY = this.createLayout('y');
}

export function layoutValue(this: LayoutNode, d: PointKey) {
  if (d == 'x') {
    return this.layoutX();
  }
  return this.layoutY();
}

export type StartEnd = 'start' | 'end';

export type LayoutSize =
  | {
      readonly value: number;
      readonly fromInside: boolean;
    }
  | number;
export function layoutSize(value: number, fromInside: boolean) {
  return {
    value,
    fromInside,
  };
}

function argSize(this: LayoutNode, d: PointKey) {
  if (d == 'x') {
    return this.argWidth();
  }
  return this.argHeight();
}
export function paddingStart(this: LayoutNode, d: PointKey) {
  if (d == 'x') {
    return this.paddingInlineStart();
  }
  return this.paddingBlockStart();
}
export function paddingEnd(this: LayoutNode, d: PointKey) {
  if (d == 'x') {
    return this.paddingInlineEnd();
  }
  return this.paddingBlockEnd();
}
export function outerSize(this: LayoutNode, d: PointKey) {
  const n = argSize.call(this, d);
  if (typeof n == 'number') {
    return n;
  }
  if (n.fromInside) {
    return n.value + paddingStart.call(this, d) + paddingEnd.call(this, d);
  }
  return n.value;
}

export function innerSize(this: LayoutNode, d: PointKey) {
  const n = argSize.call(this, d);
  if (typeof n == 'number') {
    return n - paddingStart.call(this, d) - paddingEnd.call(this, d);
  }
  if (n.fromInside) {
    return n.value;
  }
  return n.value - paddingStart.call(this, d) - paddingEnd.call(this, d);
}
