import { addTrackEffect, CollectObject, hookTrackAttr } from 'mve-core';
import {
  AlignSelfFun,
  createLayoutNode,
  emptyArray,
  InstanceCallbackOrValue,
  LayoutConfig,
  LayoutNode,
  LayoutNodeConfigure,
  PointKey,
  ValueOrGet,
} from 'wy-helper';

type XNode = {
  _layout: any;
  parent?: XNode;
  _children?: CollectObject<any, any>;
};

export type ThreeKey = PointKey | 'z';
export type DrawThreeConfig<B extends XNode> = Omit<
  LayoutNodeConfigure<B, ThreeKey>,
  'axis'
> & {
  render(n: LayoutNode<B, ThreeKey>): B;

  x?: InstanceCallbackOrValue<LayoutNode<B, PointKey>>;
  width?: InstanceCallbackOrValue<LayoutNode<B, PointKey>>;
  paddingLeft?: ValueOrGet<number>;
  paddingRight?: ValueOrGet<number>;

  y?: InstanceCallbackOrValue<LayoutNode<B, PointKey>>;
  height?: InstanceCallbackOrValue<LayoutNode<B, PointKey>>;
  paddingTop?: ValueOrGet<number>;
  paddingBottom?: ValueOrGet<number>;

  z?: InstanceCallbackOrValue<LayoutNode<B, PointKey>>;
  depth?: InstanceCallbackOrValue<LayoutNode<B, PointKey>>;
  paddingBack?: ValueOrGet<number>;
  paddingFront?: ValueOrGet<number>;

  alignSelf?: AlignSelfFun;
  alignSelfX?: AlignSelfFun;
  alignSelfY?: AlignSelfFun;
  alignSelfZ?: AlignSelfFun;
};

const config: LayoutConfig<XNode, ThreeKey> = {
  getLayout(m): void | LayoutNode<XNode, ThreeKey> {
    return m._layout;
  },
  getParentLayout(m: XNode): void | LayoutNode<XNode, ThreeKey> {
    return m.parent?._layout;
  },
  getChildren(m): readonly XNode[] {
    return m._children?.target() || emptyArray;
  },
};

export function hookDrawThree<B extends XNode>(n: DrawThreeConfig<B>) {
  const x = createLayoutNode(config as any, {
    ...n,
    axis: {
      x: {
        position: n.x,
        size: n.width,
        paddingStart: n.paddingLeft,
        paddingEnd: n.paddingRight,
        alignSelf: n.alignSelfX ?? n.alignSelf,
      },
      y: {
        position: n.y,
        size: n.height,
        // y 轴与dom相反
        paddingStart: n.paddingBottom,
        paddingEnd: n.paddingTop,
        // paddingStart: n.paddingTop,
        // paddingEnd: n.paddingBottom,
        alignSelf: n.alignSelfY ?? n.alignSelf,
      },
      z: {
        position: n.z,
        size: n.depth,
        paddingStart: n.paddingBack,
        paddingEnd: n.paddingFront,
        alignSelf: n.alignSelfZ ?? n.alignSelf,
      },
    },
  });
  x.target = n.render(x);
  x.target._layout = x;
  return x;
}

export type ThreeNode = {
  position: Position3;
};

type Position3 = {
  x: number;
  y: number;
  z: number;
};

function setPosition(
  v: number,
  b: LayoutNode<ThreeNode, ThreeKey>,
  key: PointKey
) {
  b.target.position[key] = v;
}

/**
 * group可以用
 * @param n
 */
export function hookThreePosition(n: LayoutNode<ThreeNode, ThreeKey>) {
  hookTrackAttr(n.axis.x.position, setPosition, n, 'x');
  hookTrackAttr(n.axis.y.position, setPosition, n, 'y');
  hookTrackAttr(n.axis.z.position, setPosition, n, 'z');
}

/**
 * 一般立方体,球形可以用
 * @param n
 */
export function hookThreeCenterPosition(n: LayoutNode<ThreeNode, ThreeKey>) {
  hookTrackAttr(
    () => {
      return n.axis.x.position() + n.axis.x.size() / 2;
    },
    setPosition,
    n,
    'x'
  );
  hookTrackAttr(
    () => {
      return n.axis.y.position() + n.axis.y.size() / 2;
    },
    setPosition,
    n,
    'y'
  );
  hookTrackAttr(
    () => {
      return n.axis.z.position() + n.axis.z.size() / 2;
    },
    setPosition,
    n,
    'z'
  );
}
