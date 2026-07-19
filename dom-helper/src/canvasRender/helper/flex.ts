import {
  hookCurrentStateHolder,
  StateHolder,
  StateHolderWithNode,
} from 'mve-core';
import {
  AlignItem,
  DirectionFixBetweenWhenOne,
  DirectionJustify,
  LayoutFun,
  ValueOrGet,
} from 'wy-helper';
import { Direction } from '../Node';
import { Node } from '../Node';
import { RectNode } from '../RectNode';
import { LayoutNode, layoutSize, LayoutSize } from '../layout/LayoutNode';
import { flex as createFlex } from '../layout/FlexLayout';

type SizeProvide = (node: RectNode) => LayoutSize;

function fixSize(n: number, isInside: boolean = false): SizeProvide {
  return () => ({ value: n, fromInside: isInside });
}

function sizeRelayChildren(direction: Direction): SizeProvide {
  return node => node.sizeFromChildren(direction);
}

function sizeFromParentFn(direction: Direction): SizeProvide {
  return node => node.sizeFromParent(direction);
}
export type NodeOrGet<T> = T | ((this: RectNode) => T);

function toGet<T>(n: NodeOrGet<T>): (this: RectNode) => T {
  if (typeof n == 'function') {
    return n as (this: RectNode) => T;
  }
  return function () {
    return n;
  };
}
/**
 * @todo padding的各种参数 padding/paddingX/paddingLeft...
 *
 * @param param0
 * @returns
 */
export function renderFlex({
  direction = Direction.x,
  alignItem = 'center',
  alignFix = false,
  directionJustify = 'grow',
  directionFixBetweenWhenOne = 'center',
  reverse = false,
  gap = 0,
  size = 0,
  width = size,
  height = size,
  sizeAsInner = false,
  widthAsInner = sizeAsInner,
  heightAsInner = sizeAsInner,
  ...rest
}: {
  drawSelf?(this: RectNode, canvas: CanvasRenderingContext2D): void;
  direction?: NodeOrGet<Direction>;
  alignItem?: NodeOrGet<AlignItem>;
  alignFix?: NodeOrGet<boolean>;
  directionJustify?: NodeOrGet<DirectionJustify>;
  directionFixBetweenWhenOne?: NodeOrGet<DirectionFixBetweenWhenOne>;
  reverse?: NodeOrGet<boolean>;
  gap?: NodeOrGet<number>;
  size?: NodeOrGet<number>;
  width?: NodeOrGet<number>;
  height?: NodeOrGet<number>;
  sizeAsInner?: NodeOrGet<boolean>;
  widthAsInner?: NodeOrGet<boolean>;
  heightAsInner?: NodeOrGet<boolean>;
  buildChildren?: (this: StateHolderWithNode<Node>) => void;
} = {}): RectNode {
  function toValue<T>(n: NodeOrGet<T>): (this: RectNode) => T {
    if (typeof n == 'function') {
      return function () {
        return (n as any).apply(node);
      };
    }
    return function () {
      return n;
    };
  }
  const flexLayout = createFlex({
    direction: toValue(direction),
    alignItem: toValue(alignItem),
    alignFix: toValue(alignFix),
    directionJustify: toValue(directionJustify),
    reverse: toValue(reverse),
    gap: toValue(gap),
    directionFixBetweenWhenOne: toValue(directionFixBetweenWhenOne),
  });

  const iwidth = toValue(width);
  const iheight = toValue(height);
  const iWidthAsInner = toValue(widthAsInner);
  const iHeightAsInner = toValue(heightAsInner);
  const node = new RectNode(hookCurrentStateHolder(true), {
    ...rest,
    size(d): LayoutSize {
      if (d == Direction.x) {
        return layoutSize(iwidth.apply(node), iWidthAsInner.apply(node));
      }
      return layoutSize(iheight.apply(node), iHeightAsInner.apply(node));
    },
    layout: flexLayout,
  });
  return node;
}
