import {
  absoluteLayoutFun,
  absoluteLayoutObject,
  AlignSelfFun,
  emptyObject,
  GetValue,
  Layout,
  LayoutError,
  LayoutFun,
  LayoutInsideObject,
  memo,
} from 'wy-helper';
import { StateHolder } from 'mve-core';
import {
  commonLayoutNode,
  createLayout,
  LayoutNode,
  layoutSize,
  LayoutSize,
  StartEnd,
} from './layout/LayoutNode';
import { Node, Direction } from './Node';
import { NodeI } from './NodeI';

export class RectNode extends NodeI implements LayoutNode {
  _layoutIndex = 0;
  constructor(
    context: StateHolder<Node>,
    arg: Partial<RectNode> = emptyObject
  ) {
    super(context, arg);
  }
  layoutIndex() {
    this.children();
    return this._layoutIndex;
  }
  grow() {
    return 0;
  }
  align(): AlignSelfFun | void {
    return;
  }
  readonly layoutChildren = memo(() => {
    return this.children().filter(
      c => c instanceof RectNode
    ) as unknown as LayoutNode[];
  });

  readonly layoutX: GetValue<Layout> = createLayout(this, Direction.x);
  readonly layoutY: GetValue<Layout> = createLayout(this, Direction.y);

  layoutValue(d: Direction): Layout {
    return d === Direction.x ? this.layoutX() : this.layoutY();
  }

  size(d: Direction): LayoutSize {
    return this.sizeFromParent(d);
  }
  layout(d: Direction) {
    return absoluteLayoutFun;
  }

  padding(_d: Direction, _se: StartEnd): number {
    return 0;
  }

  innerStart(d: Direction): number {
    return this.padding(d, StartEnd.start);
  }

  outerSize(d: Direction): number {
    return commonLayoutNode.outerSize(this, d);
  }

  innerSize(d: Direction): number {
    return commonLayoutNode.innerSize(this, d);
  }

  sizeFromParent(d: Direction): LayoutSize {
    const lp = this.layoutParent();
    if (lp) {
      const v = lp.layoutValue(d).childSize(this.layoutIndex());
      return layoutSize(v, false);
    }
    throw new Error('未找到父节点');
  }

  sizeFromChildren(d: Direction): LayoutSize {
    return layoutSize(this.layoutValue(d).sizeFromChildren(), true);
  }

  layoutParent(): LayoutNode | void {
    let p: Node | null = this.parent;
    while (p) {
      if (p instanceof RectNode) {
        return p as unknown as LayoutNode;
      }
      p = p.parent;
    }
  }

  position(d: Direction): number {
    const lp = this.layoutParent();
    if (lp) {
      try {
        return lp.layoutValue(d).childPosition(this.layoutIndex());
      } catch (_e) {
        if (_e instanceof LayoutError) {
        } else {
          throw _e;
        }
      }
    }
    return 0;
  }

  override acceptHit(x: number, y: number): boolean {
    const w = this.outerSize(Direction.x);
    const h = this.outerSize(Direction.y);
    return x > 0 && x < w && y > 0 && y < h;
  }
}
