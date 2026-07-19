import { StateHolderWithNode } from 'mve-core';
import { NodeI } from './NodeI';
import { RectNode } from './RectNode';

export enum Direction {
  x = 'x',
  y = 'y',
}

export const DirectionOpposite: Record<Direction, Direction> = {
  [Direction.x]: Direction.y,
  [Direction.y]: Direction.x,
};

export interface NodeWithPosition {
  node: Node;
  x: number;
  y: number;
  next: NodeWithPosition | null;
}

export interface Node {
  parent: Node | null;
  children(): Node[];
  index(): number;
  position(d: Direction): number;
  acceptHit(x: number, y: number): boolean;

  mouseClick(e: import('./MouseEvent').MouseEvent): void;
  mouseClickCapture(e: import('./MouseEvent').MouseEvent): void;
  mouseDown(e: import('./MouseEvent').MouseEvent): void;
  mouseDownCapture(e: import('./MouseEvent').MouseEvent): void;
  mouseUp(e: import('./MouseEvent').MouseEvent): void;
  mouseUpCapture(e: import('./MouseEvent').MouseEvent): void;
  draw(canvas: CanvasRenderingContext2D): void;
  drawSelf(canvas: CanvasRenderingContext2D): void;
}

export function hitest(
  node: Node,
  x: number,
  y: number
): NodeWithPosition | null {
  const rx = x - node.position(Direction.x);
  const ry = y - node.position(Direction.y);
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

export function absolutePosition(node: Node, d: Direction): number {
  let n = node.position(d);
  let p = node.parent;
  while (p) {
    n += p.position(d);
    p = p.parent;
  }
  return n;
}

export function collectIndex(list: Node[]): void {
  let index = 0;
  let layoutIndex = 0;
  for (const node of list) {
    if (node instanceof NodeI) node._index = index++;
    if (node instanceof RectNode) node._layoutIndex = layoutIndex++;
  }
}
