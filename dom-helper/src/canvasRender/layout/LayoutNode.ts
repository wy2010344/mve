import {
  Layout,
  AlignSelfFun,
  LayoutFun,
  memo,
  absoluteLayoutFun,
} from 'wy-helper';
import { Direction } from '../Node';

export type { Layout, LayoutFun };

// ---------------------------------------------------------------------------
// LayoutNode — the engine's node that participates in layout
// ---------------------------------------------------------------------------

export interface LayoutNode {
  grow(): number;
  align(): AlignSelfFun | void;
  layoutParent(): LayoutNode | void;
  layoutIndex(): number;
  layout(d: Direction): LayoutFun<LayoutNode>;
  layoutValue(d: Direction): Layout;
  padding(d: Direction, se: StartEnd): number;
  innerStart(d: Direction): number;
  layoutChildren(): LayoutNode[];
  sizeFromParent(d: Direction): LayoutSize;
  sizeFromChildren(d: Direction): LayoutSize;
  size(d: Direction): LayoutSize;
  outerSize(d: Direction): number;
  innerSize(d: Direction): number;
}

export enum StartEnd {
  start = 'start',
  end = 'end',
}

export interface LayoutSize {
  readonly value: number;
  readonly fromInside: boolean;
}
export function layoutSize(value: number, fromInside: boolean) {
  return {
    value,
    fromInside,
  };
}

export const commonLayoutNode = {
  outerSize(o: LayoutNode, d: Direction): number {
    const s = o.size(d);
    return s.fromInside
      ? s.value +
          o.padding(d, StartEnd.start) +
          o.padding(d, StartEnd.end)
      : s.value;
  },
  innerSize(o: LayoutNode, d: Direction): number {
    const s = o.size(d);
    return s.fromInside
      ? s.value
      : s.value -
          o.padding(d, StartEnd.start) -
          o.padding(d, StartEnd.end);
  },
};

export function createLayout(o: LayoutNode, direction: Direction) {
  const layout = {
    children: o.layoutChildren,
    innerSize() {
      return o.innerSize(direction);
    },
  };
  return memo(function () {
    return o.layout(Direction.y).createLayout(layout);
  });
}

export function absoluteLayout(): LayoutFun<any> {
  return absoluteLayoutFun;
}

export function sizeFromParent(value: number, fromInside: boolean): LayoutSize {
  return layoutSize(value, fromInside);
}
