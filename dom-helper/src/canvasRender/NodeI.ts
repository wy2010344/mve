import { emptyObject, GetValue } from 'wy-helper';
import { StateHolder, StateHolderWithNode } from 'mve-core';
import { Node, collectIndex, Direction } from './Node';
import { MouseEvent } from './MouseEvent';

export class NodeI implements Node {
  readonly parent: Node;
  readonly children: GetValue<Node[]>;
  _index: number = 0;
  index() {
    this.children();
    return this._index;
  }
  constructor(
    readonly context: StateHolder<Node>,
    arg: Partial<Node> = emptyObject
  ) {
    const p = context.getParent() as Node | undefined;
    if (!p) {
      throw new Error('需要找到父节点才行');
    }
    //重写
    Object.assign(this, arg);
    this.parent = p;
    this.children = context.renderNode(this, collectIndex, this.buildChildren);
  }

  buildChildren(this: StateHolderWithNode<Node>) {}

  position(_d: Direction): number {
    return 0;
  }

  acceptHit(_x: number, _y: number): boolean {
    return false;
  }

  mouseClick(_e: MouseEvent): void {}
  mouseClickCapture(_e: MouseEvent): void {}
  mouseDown(_e: MouseEvent): void {}
  mouseDownCapture(_e: MouseEvent): void {}
  mouseUp(_e: MouseEvent): void {}
  mouseUpCapture(_e: MouseEvent): void {}

  draw(canvas: CanvasRenderingContext2D): void {
    this.drawSelf(canvas);
    for (const child of this.children()) {
      canvas.save();
      const x = child.position(Direction.x);
      const y = child.position(Direction.y);
      canvas.translate(x, y);
      child.draw(canvas);
      canvas.restore();
    }
  }

  drawSelf(_canvas: CanvasRenderingContext2D): void {}
}
