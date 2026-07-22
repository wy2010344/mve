import { StateHolder, StateHolderWithNode } from 'mve-core';
import { type RectNode } from './RectNode';
import { emptyArray, PointKey, ValueOrGet, valueOrGetToGet } from 'wy-helper';
import { MouseEvent } from './MouseEvent';
import { type LayoutNode } from './LayoutNode';

export interface NodeWithPosition {
  node: Node;
  x: number;
  y: number;
  next: NodeWithPosition | null;
}

export interface NodeArg<T = Node> {
  position?: ValueOrGet<number, T, [PointKey]>;
  x?: ValueOrGet<number, T>;
  y?: ValueOrGet<number, T>;
  draw?(this: T, ctx: CanvasRenderingContext2D): void;
  children?(this: StateHolderWithNode<Node, readonly Node[]>): void;

  mouseClick?(this: T, e: MouseEvent): void;
  mouseClickCapture?(this: T, e: MouseEvent): void;
  mouseDown?(this: T, e: MouseEvent): void;
  mouseUp?(this: T, e: MouseEvent): void;
  mouseDownCapture?(this: T, e: MouseEvent): void;
  mouseUpCapture?(this: T, e: MouseEvent): void;
}
export class Node {
  isLayout(): this is LayoutNode {
    return false;
  }
  constructor(
    context: StateHolder<Node> | void,
    args: NodeArg<Node>,
    parent?: Node
  ) {
    this.mouseClick = args.mouseClick || this.mouseClick;
    this.mouseClickCapture = args.mouseClickCapture || this.mouseClickCapture;
    this.mouseDown = args.mouseDown || this.mouseDown;
    this.mouseUp = args.mouseUp || this.mouseUp;
    this.mouseDownCapture = args.mouseDownCapture || this.mouseDownCapture;
    this.mouseUpCapture = args.mouseUpCapture || this.mouseUpCapture;

    this.argChildren = args.children || this.argChildren;
    this.argPosition = valueOrGetToGet(args.position, this.argPosition);
    this.x = valueOrGetToGet(args.x, this.x);
    this.y = valueOrGetToGet(args.y, this.y);
    this.draw = args.draw || this.draw;
    if (context) {
      this.parent = context.getParent();
      if (!this.parent) throw new Error('需要找到父节点才行');
      this.children = context.renderListNode(
        this,
        collectIndex,
        this.argChildren
      );
    } else {
      this.parent = parent;
    }
  }

  argChildren(this: StateHolderWithNode<Node, readonly Node[]>) {}
  argPosition(d: PointKey): number {
    return 0;
  }
  x() {
    return this.argPosition('x');
  }
  y() {
    return this.argPosition('y');
  }
  children(): readonly Node[] {
    return emptyArray;
  }
  readonly parent: Node | undefined;

  _index = 0;

  index() {
    this.parent?.children();
    return this._index;
  }

  acceptHit(x: number, y: number): boolean {
    return false;
  }

  mouseClick(e: MouseEvent): void {}
  mouseClickCapture(e: MouseEvent): void {}
  mouseDown(e: MouseEvent): void {}
  mouseDownCapture(e: MouseEvent): void {}
  mouseUp(e: MouseEvent): void {}
  mouseUpCapture(e: MouseEvent): void {}
  draw(canvas: CanvasRenderingContext2D): void {
    this.children().forEach(child => {
      canvas.save();
      canvas.translate(child.x(), child.y());
      child.draw(canvas);
      canvas.restore();
    });
  }
}

export function hitest(
  node: Node,
  x: number,
  y: number
): NodeWithPosition | null {
  const rx = x - node.x();
  const ry = y - node.y();
  const children = node.children();
  for (let i = children.length - 1; i >= 0; i--) {
    const found = hitest(children[i], rx, ry);
    if (found) {
      return { node, x: rx, y: ry, next: found };
    }
  }
  if (node.acceptHit(rx, ry)) {
    return { node, x: rx, y: ry, next: null };
  }
  return null;
}

function position(this: Node, d: PointKey) {
  if (d == 'x') {
    return this.x();
  }
  return this.y();
}

export function absolutePosition(this: Node, d: PointKey): number {
  let n = position.call(this, d);
  let p = this.parent;
  while (p) {
    n += position.call(p, d);
    p = p.parent;
  }
  return n;
}

export function collectIndex(list: readonly Node[]): void {
  let index = 0;
  let layoutIndex = 0;
  for (const node of list) {
    node._index = index++;
    if (node.isLayout()) node._layoutIndex = layoutIndex++;
  }
}
