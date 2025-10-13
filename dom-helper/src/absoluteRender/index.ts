import { hookAddDestroy, addTrackEffect } from 'mve-core';
import { StyleProps } from 'mve-dom';
import { hookTrackSignal } from 'mve-helper';
import {
  DomElement,
  DomElementType,
  SvgElement,
  SvgElementType,
} from 'wy-dom-helper';
import {
  addEffect,
  batchSignalEnd,
  createSignal,
  emptyArray,
  emptyFun,
  GetValue,
  LayoutConfig,
  LayoutNodeConfigure,
  PointKey,
  SetValue,
  ValueOrGet,
} from 'wy-helper';
import { InstanceCallbackOrValue, MDisplayOut } from 'wy-helper';
import { createLayoutNode, LayoutNode } from 'wy-helper';

/**
 * 应该可以细分
 */
export type ADomAttributes<T> = Omit<
  LayoutNodeConfigure<T, PointKey>,
  'axis'
> & {
  x?: InstanceCallbackOrValue<LayoutNode<T, PointKey>>;
  y?: InstanceCallbackOrValue<LayoutNode<T, PointKey>>;

  width?: InstanceCallbackOrValue<LayoutNode<T, PointKey>>;
  height?: InstanceCallbackOrValue<LayoutNode<T, PointKey>>;

  paddingLeft?: ValueOrGet<number>;
  paddingRight?: ValueOrGet<number>;

  paddingTop?: ValueOrGet<number>;
  paddingBottom?: ValueOrGet<number>;
  render(n: LayoutNode<T, PointKey>): T;
};

const config: LayoutConfig<any, PointKey> = {
  getLayout(m: any) {
    return m._rect;
  },
  getParentLayout(m: any) {
    return m.parentNode?._rect;
  },
  getChildren(m) {
    return (m as any)._mve_children_?.target() || emptyArray;
  },
};

/**
 * 比如style需要设置为
  position: 'absolute',
  minWidth: 0,
  minHeight: 0,
 * @param c 
 * @returns 
 */
export function renderALayout<T>(
  c: ADomAttributes<T>
): LayoutNode<T, PointKey> {
  const n = createLayoutNode(config as any, {
    ...c,
    axis: {
      x: {
        position: c.x,
        size: c.width,
        paddingStart: c.paddingLeft,
        paddingEnd: c.paddingRight,
      },
      y: {
        position: c.y,
        size: c.height,
        paddingStart: c.paddingTop,
        paddingEnd: c.paddingBottom,
      },
    },
  });
  const target = c.render(n);
  n.target = target;
  (target as any)._rect = n;
  return n;
}

export function hookMeasureSize() {
  const width = createSignal(0);
  const height = createSignal(0);
  const addDestroy = hookAddDestroy();
  let inited = false;
  return {
    width: width.get,
    height: height.get,
    plugin(target: HTMLElement) {
      if (inited) {
        throw new Error('can not init again');
      }
      inited = true;
      addEffect(() => {
        const cb = (e?: any) => {
          width.set(target.offsetWidth);
          height.set(target.offsetHeight);
          if (e) {
            batchSignalEnd();
          }
        };
        cb();
        const ob = new ResizeObserver(cb);
        ob.observe(target);
        addDestroy(() => {
          ob.disconnect();
        });
      }, -2);
      return target;
    },
  };
}
