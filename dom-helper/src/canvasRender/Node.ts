import {
  ShareConfig,
  StateHolder,
  StateHolderWithNode,
  ValueOrGetList,
} from 'mve-core';
import { emptyArray, PointKey, ValueOrGet, valueOrGetToGet } from 'wy-helper';
import { MouseEvent } from './MouseEvent';
import { EngineGlobal, engineGlobalContext } from './EngineGlobal';
import type { LayoutNode } from './LayoutNode';

export interface NodeWithPosition {
  node: Node;
  x: number;
  y: number;
  next: NodeWithPosition | null;
}

interface ScrollContentLike extends LayoutNode {
  isScrollContent: true;
}

export function include(this: NodeWithPosition, node: Node): boolean {
  let n: NodeWithPosition | null = this;
  while (n) {
    if (n.node === node) {
      return true;
    }
    n = n.next;
  }
  return false;
}

export function last(this: NodeWithPosition): NodeWithPosition {
  let it: NodeWithPosition = this;
  while (it.next) {
    it = it.next;
  }
  return it;
}

export function contains(this: Node, node: Node): boolean {
  if (node === this) {
    return true;
  }
  return this.children().some(it => it === node);
}

export interface NodeArg<T = Node> {
  exts?: ((this: T) => readonly any[]) | readonly any[];
  position?: ValueOrGet<number, T, [PointKey]>;
  x?: ValueOrGet<number, T>;
  y?: ValueOrGet<number, T>;
  hide?: ValueOrGet<boolean, T>;
  focusable?: ValueOrGet<boolean, T>;
  focusOrder?: ValueOrGet<number | void, T>;
  draw?(this: T, ctx: CanvasRenderingContext2D): void;
  children?(this: StateHolderWithNode<Node, readonly Node[]>): void;

  acceptHit?(this: T, x: number, y: number): boolean;
  acceptClip?(this: T, x: number, y: number): boolean;

  mouseClick?(this: T, e: MouseEvent): void;
  mouseClickCapture?(this: T, e: MouseEvent): void;
  mouseDown?(this: T, e: MouseEvent): void;
  mouseUp?(this: T, e: MouseEvent): void;
  mouseDownCapture?(this: T, e: MouseEvent): void;
  mouseUpCapture?(this: T, e: MouseEvent): void;
  mouseMove?(this: T, e: MouseEvent): void;
  mouseMoveCapture?(this: T, e: MouseEvent): void;
}

function flatten(list: readonly ValueOrGetList<Node>[], out: Node[]): void {
  for (const child of list) {
    if (typeof child == 'function') {
      flatten((child as () => ValueOrGetList<Node>[])(), out);
    } else if (!child.hide()) {
      out.push(child);
    }
  }
}

export const nodeConfig: ShareConfig<Node, readonly Node[]> = {
  after: collectIndex,
  purifyList(list) {
    const newList: Node[] = [];
    flatten(list, newList);
    return newList;
  },
};

export class Node {
  private readonly exts: readonly any[];
  findExt<T>(c: new (...vs: any[]) => T): T | undefined {
    return this.exts.find(x => x instanceof c);
  }

  readonly engineGlobal: EngineGlobal | null;

  constructor(context: StateHolder<Node, readonly Node[]> | void, args: NodeArg<Node>) {
    this.mouseClick = args.mouseClick || this.mouseClick;
    this.mouseClickCapture = args.mouseClickCapture || this.mouseClickCapture;
    this.mouseDown = args.mouseDown || this.mouseDown;
    this.mouseUp = args.mouseUp || this.mouseUp;
    this.mouseDownCapture = args.mouseDownCapture || this.mouseDownCapture;
    this.mouseUpCapture = args.mouseUpCapture || this.mouseUpCapture;
    this.mouseMove = args.mouseMove || this.mouseMove;
    this.mouseMoveCapture = args.mouseMoveCapture || this.mouseMoveCapture;

    this.argChildren = args.children || this.argChildren;
    this.argPosition = valueOrGetToGet(args.position, this.argPosition);
    this.x = valueOrGetToGet(args.x, this.x);
    this.y = valueOrGetToGet(args.y, this.y);
    this.hide = valueOrGetToGet(args.hide, this.hide);
    this.focusable = valueOrGetToGet(args.focusable, this.focusable);
    this.focusOrder = valueOrGetToGet(args.focusOrder, this.focusOrder);
    this.draw = args.draw || this.draw;

    if (args.acceptHit) {
      this.acceptHit = args.acceptHit.bind(this);
    }
    if (args.acceptClip) {
      this.acceptClip = args.acceptClip.bind(this);
    }

    const e = args.exts;
    if (e) {
      if (Array.isArray(e)) {
        this.exts = e;
      } else {
        this.exts = (e as any).call(this);
      }
    } else {
      this.exts = emptyArray;
    }

    this.engineGlobal = context ? context.consume(engineGlobalContext) : null;

    if (context) {
      const p = context.getParent();
      if (p instanceof Node) {
        this.parent = p;
        context.addNode(this);
      } else if (p) {
        this.parent = undefined;
      } else {
        throw new Error('需要找到父节点才行');
      }
      this.children = context.renderNode(this, this.argChildren);
    } else {
      this.parent = undefined;
    }
  }

  argChildren(this: StateHolderWithNode<Node, readonly Node[]>) {}
  argPosition(d: PointKey): number {
    return 0;
  }
  x(): number {
    return this.argPosition('x');
  }
  y(): number {
    return this.argPosition('y');
  }
  hide(): boolean {
    return false;
  }
  focusable(): boolean {
    return false;
  }
  focusOrder(): number | void {}
  isFocused(): boolean {
    return this.engineGlobal?.focused() === this;
  }
  requestFocus(): void {
    if (this.engineGlobal) {
      this.engineGlobal.setFocused(this);
    }
  }
  children: () => readonly Node[] = () => emptyArray;
  readonly parent: Node | undefined;

  _index = 0;

  index() {
    if (this.hide()) {
      throw new Error('已经隐藏不再显示');
    }
    this.parent?.children();
    return this._index;
  }

  acceptHit(x: number, y: number): boolean {
    return false;
  }

  acceptClip(x: number, y: number): boolean {
    return true;
  }

  mouseClick(e: MouseEvent): void {}
  mouseClickCapture(e: MouseEvent): void {}
  mouseDown(e: MouseEvent): void {}
  mouseDownCapture(e: MouseEvent): void {}
  mouseUp(e: MouseEvent): void {}
  mouseUpCapture(e: MouseEvent): void {}
  mouseMove(e: MouseEvent): void {}
  mouseMoveCapture(e: MouseEvent): void {}

  draw(ctx: CanvasRenderingContext2D): void {
    for (const child of this.children()) {
      ctx.save();
      const sc = child as ScrollContentLike;
      if (sc.isScrollContent) {
        const p = sc.layoutParent!;
        const x = p.paddingInlineStart();
        const y = p.paddingBlockStart();
        ctx.beginPath();
        ctx.rect(x, y, p.innerWidth(), p.innerHeight());
        ctx.clip();
      }
      ctx.translate(child.x(), child.y());
      child.draw(ctx);
      ctx.restore();
    }
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
    const child = children[i];
    if (child.acceptClip(rx, ry)) {
      const found = hitest(child, rx, ry);
      if (found) {
        return { node, x: rx, y: ry, next: found };
      }
    }
  }
  if (node.acceptHit(rx, ry)) {
    return { node, x: rx, y: ry, next: null };
  }
  return null;
}

export function position(this: Node, d: PointKey): number {
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

export function absoluteX(this: Node): number {
  return absolutePosition.call(this, 'x');
}

export function absoluteY(this: Node): number {
  return absolutePosition.call(this, 'y');
}

export function collectIndex(list: readonly Node[]): void {
  let index = 0;
  for (const node of list) {
    node._index = index++;
  }
}
