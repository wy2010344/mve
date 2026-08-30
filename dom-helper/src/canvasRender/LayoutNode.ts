import { StateHolder } from 'mve-core';
import {
  Layout,
  LayoutFun,
  memo,
  absoluteLayoutFun,
  ValueOrGet,
  PointKey,
  valueOrGetToGet,
  LayoutInsideObject,
} from 'wy-helper';
import { Node, NodeArg, absolutePosition } from './Node';
import { ColorInt, rgba, colorToCSS } from './Draw';
import { inRange } from './util';

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
  notInLayout?: ValueOrGet<boolean, T>;
}
export class LayoutNode extends Node {
  constructor(context: StateHolder<Node, readonly Node[]> | void, args: LayoutNodeArg) {
    super(context, args as any);

    this.argPadding = valueOrGetToGet(args.padding, this.argPadding);
    this.argPaddingBlock = valueOrGetToGet(args.paddingBlock, this.argPaddingBlock);
    this.argPaddingInline = valueOrGetToGet(args.paddingInline, this.argPaddingInline);
    this.paddingBlockStart = valueOrGetToGet(args.paddingBlockStart, this.paddingBlockStart);
    this.paddingBlockEnd = valueOrGetToGet(args.paddingBlockEnd, this.paddingBlockEnd);
    this.paddingInlineStart = valueOrGetToGet(args.paddingInlineStart, this.paddingInlineStart);
    this.paddingInlineEnd = valueOrGetToGet(args.paddingInlineEnd, this.paddingInlineEnd);

    this.argSize = valueOrGetToGet(args.size, this.argSize);
    this.argWidth = valueOrGetToGet(args.width, this.argWidth);
    this.argHeight = valueOrGetToGet(args.height, this.argHeight);
    this.notInLayout = valueOrGetToGet(args.notInLayout, this.notInLayout);
    if (args.layout) {
      if (typeof args.layout == 'function') {
        this.layout = (args.layout as any).call(this);
      } else {
        this.layout = args.layout as any;
      }
    }

    let p: Node | undefined = this.parent;
    while (p) {
      if (p instanceof LayoutNode) {
        this.layoutParent = p;
        break;
      }
      p = p.parent;
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
    return layoutSize0;
  }
  argWidth() {
    return this.argSize('x');
  }
  argHeight() {
    return this.argSize('y');
  }

  layout: LayoutDirection = {
    layout() {
      return absoluteLayoutFun;
    },
  };
  layoutParent: LayoutNode | void = undefined;
  layoutChildren = memo<readonly LayoutNode[]>(
    () => {
      const list: LayoutNode[] = [];
      findLayoutChildren(this, list);
      return list;
    },
    list => {
      let i = 0;
      list.forEach(row => {
        row._layoutIndex = i++;
      });
    }
  );
  _layoutIndex = 0;
  notInLayout(): boolean {
    return false;
  }
  layoutIndex(): number {
    if (this.hide()) {
      throw new Error('已经隐藏不再显示');
    }
    if (this.notInLayout()) {
      throw new Error('当前节点不在Layout中');
    }
    this.layoutParent?.layoutChildren();
    return this._layoutIndex;
  }
  acceptHit(x: number, y: number): boolean {
    const w = outerSize.call(this, 'x');
    const h = outerSize.call(this, 'y');
    return x > 0 && y > 0 && x < w && y < h;
  }

  outerWidth() {
    return outerSize.call(this, 'x');
  }
  outerHeight() {
    return outerSize.call(this, 'y');
  }
  innerWidth() {
    return innerSize.call(this, 'x');
  }
  innerHeight() {
    return innerSize.call(this, 'y');
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

export const layoutSize0 = {
  value: 0,
  fromInside: true,
};

/**
 * LayoutSize + 方向：指定某个方向上的一种尺寸，另一方向按比例推算（如 ImageNode）。
 */
export type LayoutSizeDirection = {
  direction: PointKey;
  value: number;
  fromInside: boolean;
};

export function layoutSizeDirection(
  direction: PointKey,
  value: number,
  fromInside: boolean
): LayoutSizeDirection {
  return { direction, value, fromInside };
}

function argSize(this: LayoutNode, d: PointKey) {
  if (d == 'x') {
    return this.argWidth();
  }
  return this.argHeight();
}

export function padding(this: LayoutNode, d: PointKey, s: StartEnd) {
  if (d == 'x') {
    return s == 'start' ? this.paddingInlineStart() : this.paddingInlineEnd();
  }
  return s == 'start' ? this.paddingBlockStart() : this.paddingBlockEnd();
}

export function size(this: LayoutNode, d: PointKey) {
  return argSize.call(this, d);
}

export function paddingStart(this: LayoutNode, d: PointKey) {
  return padding.call(this, d, 'start');
}
export function paddingEnd(this: LayoutNode, d: PointKey) {
  return padding.call(this, d, 'end');
}
export function outerSize(this: LayoutNode, d: PointKey) {
  const n = argSize.call(this, d);
  if (typeof n == 'number') {
    return Math.max(0, n);
  }
  if (n.fromInside) {
    return Math.max(0, n.value + paddingStart.call(this, d) + paddingEnd.call(this, d));
  }
  return Math.max(0, n.value);
}

export function innerSize(this: LayoutNode, d: PointKey) {
  const n = argSize.call(this, d);
  if (typeof n == 'number') {
    return Math.max(0, n - paddingStart.call(this, d) - paddingEnd.call(this, d));
  }
  if (n.fromInside) {
    return Math.max(0, n.value);
  }
  return Math.max(0, n.value - paddingStart.call(this, d) - paddingEnd.call(this, d));
}

function findLayoutChildren(n: Node, list: LayoutNode[]) {
  n.children().forEach(x => {
    if (x instanceof LayoutNode) {
      if (!x.notInLayout()) {
        list.push(x);
      }
    } else {
      findLayoutChildren(x, list);
    }
  });
}

export function sizeFromParent(this: LayoutNode, d: PointKey): LayoutSize {
  const lp = this.layoutParent;
  if (lp) {
    return {
      value: layoutValue.call(lp, d).childSize(this.layoutIndex()),
      fromInside: false,
    };
  }
  throw new Error('未找到父节点');
}

export function sizeFromChildren(this: LayoutNode, d: PointKey): LayoutSize {
  return {
    value: layoutValue.call(this, d).sizeFromChildren(),
    fromInside: true,
  };
}

export function absoluteInInner(this: LayoutNode, x: number, y: number): boolean {
  return (
    inRange(
      absolutePosition.call(this, 'x') + this.paddingInlineStart(),
      x,
      innerSize.call(this, 'x')
    ) &&
    inRange(
      absolutePosition.call(this, 'y') + this.paddingBlockStart(),
      y,
      innerSize.call(this, 'y')
    )
  );
}

// ---------------------------------------------------------------------------
// fill/stroke 工具（直接操作 CanvasRenderingContext2D）
// ---------------------------------------------------------------------------

export function fillInnerRect(
  this: LayoutNode,
  ctx: CanvasRenderingContext2D,
  color: ColorInt = rgba(0, 0, 0)
) {
  ctx.fillStyle = colorToCSS(color);
  ctx.fillRect(this.paddingInlineStart(), this.paddingBlockStart(), innerSize.call(this, 'x'), innerSize.call(this, 'y'));
}

export function fillOuterRect(
  this: LayoutNode,
  ctx: CanvasRenderingContext2D,
  color: ColorInt = rgba(0, 0, 0)
) {
  ctx.fillStyle = colorToCSS(color);
  ctx.fillRect(0, 0, outerSize.call(this, 'x'), outerSize.call(this, 'y'));
}

export function strokeInnerRect(
  this: LayoutNode,
  ctx: CanvasRenderingContext2D,
  color: ColorInt = rgba(0, 0, 0),
  strokeWidth: number = 1
) {
  ctx.strokeStyle = colorToCSS(color);
  ctx.lineWidth = strokeWidth;
  ctx.strokeRect(
    this.paddingInlineStart(),
    this.paddingBlockStart(),
    innerSize.call(this, 'x'),
    innerSize.call(this, 'y')
  );
}

export function strokeOuterRect(
  this: LayoutNode,
  ctx: CanvasRenderingContext2D,
  color: ColorInt = rgba(0, 0, 0),
  strokeWidth: number = 1
) {
  ctx.strokeStyle = colorToCSS(color);
  ctx.lineWidth = strokeWidth;
  ctx.strokeRect(0, 0, outerSize.call(this, 'x'), outerSize.call(this, 'y'));
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function fillOuterRoundRect(
  this: LayoutNode,
  ctx: CanvasRenderingContext2D,
  radius: number,
  color: ColorInt = rgba(0, 0, 0)
) {
  ctx.fillStyle = colorToCSS(color);
  roundRectPath(ctx, 0, 0, outerSize.call(this, 'x'), outerSize.call(this, 'y'), radius);
  ctx.fill();
}

export function fillInnerRoundRect(
  this: LayoutNode,
  ctx: CanvasRenderingContext2D,
  radius: number,
  color: ColorInt = rgba(0, 0, 0)
) {
  ctx.fillStyle = colorToCSS(color);
  roundRectPath(
    ctx,
    this.paddingInlineStart(),
    this.paddingBlockStart(),
    innerSize.call(this, 'x'),
    innerSize.call(this, 'y'),
    radius
  );
  ctx.fill();
}

export function strokeOuterRoundRect(
  this: LayoutNode,
  ctx: CanvasRenderingContext2D,
  radius: number,
  color: ColorInt = rgba(0, 0, 0),
  strokeWidth: number = 1
) {
  ctx.strokeStyle = colorToCSS(color);
  ctx.lineWidth = strokeWidth;
  roundRectPath(ctx, 0, 0, outerSize.call(this, 'x'), outerSize.call(this, 'y'), radius);
  ctx.stroke();
}

export function strokeInnerRoundRect(
  this: LayoutNode,
  ctx: CanvasRenderingContext2D,
  radius: number,
  color: ColorInt = rgba(0, 0, 0),
  strokeWidth: number = 1
) {
  ctx.strokeStyle = colorToCSS(color);
  ctx.lineWidth = strokeWidth;
  roundRectPath(
    ctx,
    this.paddingInlineStart(),
    this.paddingBlockStart(),
    innerSize.call(this, 'x'),
    innerSize.call(this, 'y'),
    radius
  );
  ctx.stroke();
}

export function fillOuterOval(
  this: LayoutNode,
  ctx: CanvasRenderingContext2D,
  color: ColorInt = rgba(0, 0, 0)
) {
  ctx.fillStyle = colorToCSS(color);
  ctx.beginPath();
  ctx.ellipse(
    outerSize.call(this, 'x') / 2,
    outerSize.call(this, 'y') / 2,
    outerSize.call(this, 'x') / 2,
    outerSize.call(this, 'y') / 2,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function fillInnerOval(
  this: LayoutNode,
  ctx: CanvasRenderingContext2D,
  color: ColorInt = rgba(0, 0, 0)
) {
  ctx.fillStyle = colorToCSS(color);
  const x = this.paddingInlineStart();
  const y = this.paddingBlockStart();
  const w = innerSize.call(this, 'x');
  const h = innerSize.call(this, 'y');
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function strokeOuterOval(
  this: LayoutNode,
  ctx: CanvasRenderingContext2D,
  color: ColorInt = rgba(0, 0, 0),
  strokeWidth: number = 1
) {
  ctx.strokeStyle = colorToCSS(color);
  ctx.lineWidth = strokeWidth;
  ctx.beginPath();
  ctx.ellipse(
    outerSize.call(this, 'x') / 2,
    outerSize.call(this, 'y') / 2,
    outerSize.call(this, 'x') / 2,
    outerSize.call(this, 'y') / 2,
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();
}

export function strokeInnerOval(
  this: LayoutNode,
  ctx: CanvasRenderingContext2D,
  color: ColorInt = rgba(0, 0, 0),
  strokeWidth: number = 1
) {
  ctx.strokeStyle = colorToCSS(color);
  ctx.lineWidth = strokeWidth;
  const x = this.paddingInlineStart();
  const y = this.paddingBlockStart();
  const w = innerSize.call(this, 'x');
  const h = innerSize.call(this, 'y');
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
}

export function strokeOuterRing(
  this: LayoutNode,
  ctx: CanvasRenderingContext2D,
  gap: number,
  radius: number,
  color: ColorInt = rgba(0, 0, 0),
  strokeWidth: number = 1
) {
  ctx.strokeStyle = colorToCSS(color);
  ctx.lineWidth = strokeWidth;
  roundRectPath(
    ctx,
    -gap,
    -gap,
    outerSize.call(this, 'x') + gap * 2,
    outerSize.call(this, 'y') + gap * 2,
    radius
  );
  ctx.stroke();
}

export function drawRect(
  this: LayoutNode,
  ctx: CanvasRenderingContext2D,
  stroke: boolean = false,
  inner: boolean = false
) {
  const rect: [number, number, number, number] = inner
    ? [
        this.paddingInlineStart(),
        this.paddingBlockStart(),
        innerSize.call(this, 'x'),
        innerSize.call(this, 'y'),
      ]
    : [0, 0, outerSize.call(this, 'x'), outerSize.call(this, 'y')];
  if (stroke) {
    ctx.strokeRect.apply(ctx, rect);
  } else {
    ctx.fillRect.apply(ctx, rect);
  }
}
