import { LayoutError, PointKey } from 'wy-helper';
import { StateHolder } from 'mve-core';
import {
  LayoutNode,
  LayoutNodeArg,
  LayoutSize,
  layoutValue,
} from './LayoutNode';
import { Node } from './Node';

export interface RectNodeArg<T = RectNode> extends LayoutNodeArg<T> {}
export class RectNode extends LayoutNode {
  constructor(context: StateHolder<Node>, arg: RectNodeArg) {
    super(context, arg as any);

    let p: Node | undefined = this.parent;
    while (p && !this.layoutParent) {
      if (p instanceof LayoutNode) {
        this.layoutParent = p;
      }
      p = p.parent;
    }
  }
  argPosition(d: PointKey): number {
    try {
      return layoutValue
        .call(this.layoutParent!, d)
        .childPosition(this.layoutIndex());
    } catch (e) {
      if (e instanceof LayoutError) {
      } else {
        throw e;
      }
    }
    return super.argPosition(d);
  }

  argSize(d: PointKey): LayoutSize {
    const x = layoutValue.call(this, d);
    if (x.allowSizeFromChildren()) {
      return {
        value: x.sizeFromChildren(),
        fromInside: true,
      };
    }
    return {
      value: layoutValue
        .call(this.layoutParent!, d)
        .childSize(this.layoutIndex()),
      fromInside: false,
    };
  }
}
