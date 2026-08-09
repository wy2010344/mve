import {
  Layout,
  LayoutError,
  LayoutFun,
  LayoutInsideObject,
  ValueOrGet,
  absoluteLayoutFun,
  emptyArray,
  memo,
  valueOrGetToGet,
} from 'wy-helper';
import * as THREE from 'three';
import {
  ShareConfig,
  createContext,
  hookAddResult,
  hookCurrentStateHolder,
  purifySet,
  renderRoot,
} from 'mve-core';
import { hookTrackSignal } from 'mve-helper';

export type ThreeKey = 'x' | 'y' | 'z';
export type StartEnd = 'start' | 'end';

export interface LayoutDirection3 {
  layout(d: ThreeKey): LayoutFun<LayoutNode3>;
}

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

export interface LayoutNode3Arg<T = LayoutNode3> {
  exts?: ((this: T) => readonly any[]) | readonly any[];
  layout?: ValueOrGet<LayoutDirection3, T>;
  position?: ValueOrGet<number, T, [ThreeKey]>;
  x?: ValueOrGet<number, T>;
  y?: ValueOrGet<number, T>;
  z?: ValueOrGet<number, T>;
  hide?: ValueOrGet<boolean, T>;
  size?: ValueOrGet<LayoutSize, T, [ThreeKey]>;
  width?: ValueOrGet<LayoutSize, T>;
  height?: ValueOrGet<LayoutSize, T>;
  depth?: ValueOrGet<LayoutSize, T>;
  padding?: ValueOrGet<number, T, [ThreeKey, StartEnd]>;
  paddingLeft?: ValueOrGet<number, T>;
  paddingRight?: ValueOrGet<number, T>;
  paddingTop?: ValueOrGet<number, T>;
  paddingBottom?: ValueOrGet<number, T>;
  paddingBack?: ValueOrGet<number, T>;
  paddingFront?: ValueOrGet<number, T>;
  target?: THREE.Object3D;
  children?(this: T): void;
}

const object3DConfig: ShareConfig<THREE.Object3D, Set<THREE.Object3D>> = {
  purifyList(list) {
    const newSet = new Set<THREE.Object3D>();
    purifySet(list, newSet, () => false);
    return newSet;
  },
  after() {},
};

export const LayoutParentContext = createContext<LayoutNode3 | void>(
  undefined as any
);

export function renderLayoutNode3(args: LayoutNode3Arg): LayoutNode3 {
  const state = hookCurrentStateHolder(true);
  const parent = LayoutParentContext.consume();
  const node = new LayoutNode3(args, parent);
  if (parent) {
    parent.registerChild(node);
  }
  hookAddResult(node.target);
  const children = args.children;
  if (children) {
    const root = renderRoot(node.target, object3DConfig, () => {
      node.childrenList.length = 0;
      LayoutParentContext.provide(node);
      children.call(node);
    });
    node.childrenRoot = root;
    state.addDestroy(() => {
      root.destroy();
    });
  }
  state.addDestroy(() => {
    node.destroy();
  });
  return node;
}

export class LayoutNode3 {
  readonly target: THREE.Object3D;
  readonly parent: LayoutNode3 | void = undefined;
  layoutParent: LayoutNode3 | void = undefined;
  layoutChildren = memo<readonly LayoutNode3[]>(
    () => {
      const list: LayoutNode3[] = [];
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
  layoutIndex(): number {
    if (this.hide()) {
      throw new Error('已经隐藏不再显示');
    }
    this.layoutParent?.layoutChildren();
    return this._layoutIndex;
  }

  readonly childrenList: LayoutNode3[] = [];
  childrenRoot: {
    destroy(): void;
  } | void = undefined;
  _index = 0;
  index(): number {
    if (this.hide()) {
      throw new Error('已经隐藏不再显示');
    }
    this.parent?.children();
    return this._index;
  }
  children() {
    let i = 0;
    this.childrenList.forEach(c => {
      c._index = i++;
    });
    return this.childrenList;
  }
  registerChild(node: LayoutNode3) {
    this.childrenList.push(node);
  }

  readonly exts: readonly any[];
  findExt<T>(c: new (...vs: any[]) => T): T | undefined {
    return this.exts.find(x => x instanceof c);
  }

  constructor(args: LayoutNode3Arg, parent: LayoutNode3 | void) {
    this.parent = parent;
    this.target = args.target ?? new THREE.Group();

    this.argPosition = valueOrGetToGet(args.position, this.argPosition);
    this.x = valueOrGetToGet(args.x, this.x);
    this.y = valueOrGetToGet(args.y, this.y);
    this.z = valueOrGetToGet(args.z, this.z);
    this.hide = valueOrGetToGet(args.hide, this.hide);

    this.argPadding = valueOrGetToGet(args.padding, this.argPadding);
    this.paddingLeft = valueOrGetToGet(args.paddingLeft, this.paddingLeft);
    this.paddingRight = valueOrGetToGet(args.paddingRight, this.paddingRight);
    this.paddingTop = valueOrGetToGet(args.paddingTop, this.paddingTop);
    this.paddingBottom = valueOrGetToGet(
      args.paddingBottom,
      this.paddingBottom
    );
    this.paddingBack = valueOrGetToGet(args.paddingBack, this.paddingBack);
    this.paddingFront = valueOrGetToGet(args.paddingFront, this.paddingFront);

    this.argSize = valueOrGetToGet(args.size, this.argSize);
    this.argWidth = valueOrGetToGet(args.width, this.argWidth);
    this.argHeight = valueOrGetToGet(args.height, this.argHeight);
    this.argDepth = valueOrGetToGet(args.depth, this.argDepth);

    if (args.layout) {
      if (typeof args.layout == 'function') {
        this.layout = (args.layout as any).call(this);
      } else {
        this.layout = args.layout as any;
      }
    }

    this.layoutParent = parent;

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
  }

  destroy() {
    this.childrenRoot?.destroy();
    this.target.removeFromParent();
  }

  argPosition(d: ThreeKey): number {
    const lp = this.layoutParent;
    if (lp) {
      try {
        return layoutValue.call(lp, d).childPosition(this.layoutIndex());
      } catch (e) {
        if (!(e instanceof LayoutError)) {
          throw e;
        }
      }
    }
    return 0;
  }
  x(): number {
    return this.argPosition('x');
  }
  y(): number {
    return this.argPosition('y');
  }
  z(): number {
    return this.argPosition('z');
  }
  hide(): boolean {
    return false;
  }

  argPadding(d: ThreeKey, s: StartEnd) {
    return 0;
  }
  paddingLeft() {
    return 0;
  }
  paddingRight() {
    return 0;
  }
  paddingTop() {
    return 0;
  }
  paddingBottom() {
    return 0;
  }
  paddingBack() {
    return 0;
  }
  paddingFront() {
    return 0;
  }

  argSize(d: ThreeKey): LayoutSize {
    return layoutSize0;
  }
  argWidth() {
    return this.argSize('x');
  }
  argHeight() {
    return this.argSize('y');
  }
  argDepth() {
    return this.argSize('z');
  }

  layout: LayoutDirection3 = {
    layout() {
      return absoluteLayoutFun;
    },
  };

  private createLayout(d: ThreeKey) {
    const inside: LayoutInsideObject<LayoutNode3> = {
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
  layoutZ = this.createLayout('z');

  outerWidth() {
    return outerSize.call(this, 'x');
  }
  outerHeight() {
    return outerSize.call(this, 'y');
  }
  outerDepth() {
    return outerSize.call(this, 'z');
  }
  innerWidth() {
    return innerSize.call(this, 'x');
  }
  innerHeight() {
    return innerSize.call(this, 'y');
  }
  innerDepth() {
    return innerSize.call(this, 'z');
  }
}

export function layoutValue(this: LayoutNode3, d: ThreeKey): Layout {
  if (d == 'x') {
    return this.layoutX();
  }
  if (d == 'y') {
    return this.layoutY();
  }
  return this.layoutZ();
}

function findLayoutChildren(n: LayoutNode3, list: LayoutNode3[]) {
  n.children().forEach(x => {
    if (x instanceof LayoutNode3) {
      list.push(x);
    } else {
      findLayoutChildren(x, list);
    }
  });
}

export function size(this: LayoutNode3, d: ThreeKey) {
  if (d == 'x') {
    return this.argWidth();
  }
  if (d == 'y') {
    return this.argHeight();
  }
  return this.argDepth();
}

export function padding(this: LayoutNode3, d: ThreeKey, s: StartEnd) {
  if (d == 'x') {
    return s == 'start' ? this.paddingLeft() : this.paddingRight();
  }
  if (d == 'y') {
    // three中y轴与dom相反
    return s == 'start' ? this.paddingBottom() : this.paddingTop();
  }
  return s == 'start' ? this.paddingBack() : this.paddingFront();
}

export function paddingStart(this: LayoutNode3, d: ThreeKey) {
  return padding.call(this, d, 'start');
}
export function paddingEnd(this: LayoutNode3, d: ThreeKey) {
  return padding.call(this, d, 'end');
}

export function outerSize(this: LayoutNode3, d: ThreeKey) {
  const n = size.call(this, d);
  if (typeof n == 'number') {
    return Math.max(0, n);
  }
  if (n.fromInside) {
    return Math.max(
      0,
      n.value + paddingStart.call(this, d) + paddingEnd.call(this, d)
    );
  }
  return Math.max(0, n.value);
}

export function innerSize(this: LayoutNode3, d: ThreeKey) {
  const n = size.call(this, d);
  if (typeof n == 'number') {
    return Math.max(
      0,
      n - paddingStart.call(this, d) - paddingEnd.call(this, d)
    );
  }
  if (n.fromInside) {
    return Math.max(0, n.value);
  }
  return Math.max(
    0,
    n.value - paddingStart.call(this, d) - paddingEnd.call(this, d)
  );
}

export function sizeFromParent(this: LayoutNode3, d: ThreeKey): LayoutSize {
  const lp = this.layoutParent;
  if (lp) {
    return {
      value: layoutValue.call(lp, d).childSize(this.layoutIndex()),
      fromInside: false,
    };
  }
  throw new Error('未找到父节点');
}

export function sizeFromChildren(this: LayoutNode3, d: ThreeKey): LayoutSize {
  return {
    value: layoutValue.call(this, d).sizeFromChildren(),
    fromInside: true,
  };
}

/**
 * 布局位置写入物体的角点：target原点 = 布局位置 + 自身paddingStart
 */
export function hookThreePosition(n: LayoutNode3) {
  hookTrackSignal(() => {
    const lp = n.layoutParent;
    if (!lp) {
      return;
    }
    const i = n.layoutIndex();
    n.target.position.x =
      layoutValue.call(lp, 'x').childPosition(i) + n.paddingLeft();
    n.target.position.y =
      layoutValue.call(lp, 'y').childPosition(i) + n.paddingBottom();
    n.target.position.z =
      layoutValue.call(lp, 'z').childPosition(i) + n.paddingBack();
  });
}

/**
 * 布局位置写入物体的中心：target原点 = 布局位置 + paddingStart + 布局尺寸/2
 */
export function hookThreeCenterPosition(n: LayoutNode3) {
  hookTrackSignal(() => {
    const lp = n.layoutParent;
    if (!lp) {
      return;
    }
    const i = n.layoutIndex();
    n.target.position.x =
      layoutValue.call(lp, 'x').childPosition(i) +
      n.paddingLeft() +
      layoutValue.call(lp, 'x').childSize(i) / 2;
    n.target.position.y =
      layoutValue.call(lp, 'y').childPosition(i) +
      n.paddingBottom() +
      layoutValue.call(lp, 'y').childSize(i) / 2;
    n.target.position.z =
      layoutValue.call(lp, 'z').childPosition(i) +
      n.paddingBack() +
      layoutValue.call(lp, 'z').childSize(i) / 2;
  });
}
