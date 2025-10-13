/**
 
 使用方式:

在tsconfig.json里添加:

"jsx": "preserve",
"jsxFactory": "mve.createElement",
"jsxFragmentFactory": "mve.Fragment",

即在新建的tsx文件里需要导入
import { mve } from "mve-dom-helper";


在vite-env.d.ts里面添加:

declare namespace JSX {
  type IntrinsicElements = import("mve-dom-helper").mve.IntrinsicElements
  type Element = import("mve-dom-helper").mve.Element
  type ElementChildrenAttribute = import("mve-dom-helper").mve.ElementChildrenAttribute
  type IntrinsicAttributes = import("mve-dom-helper").mve.IntrinsicAttributes
}

最终接受的JSX.Element:
使用Better.renderChild(...)来hook到fiber上去
 */

import { fdom, fsvg, renderChildren, renderTextContent } from 'mve-dom';
import { isSVG } from 'wy-dom-helper';
import { GetValue } from 'wy-helper';

type ConvertMapToUnion<T> = {
  [K in keyof T]: { type: K; props?: T[K] };
}[keyof T];
export type FC<T> = (arg: T & {}) => void;
type NodeElement<T = Record<string, any>> =
  | {
      type: FC<T>;
      props: T;
      children: mve.ChildrenElement;
    }
  | ConvertMapToUnion<mve.IntrinsicElements>;

type PureValue = null | undefined | string | boolean | number | void;
type BElement = NodeElement | PureValue | GetValue<PureValue>;

export namespace mve {
  export type IntrinsicElements = {
    [key in import('wy-dom-helper').DomElementType]: import('mve-dom').FPDomAttributes<key> & {
      children?: mve.ChildrenElement;
    };
  } & {
    [key in import('wy-dom-helper').SvgElementType]: import('mve-dom').FPSvgAttributes<key> & {
      children?: mve.ChildrenElement;
    };
  };

  export type Element = BElement;
  /**
   * 约束默认的children类型
   */
  export interface ElementChildrenAttribute {
    children?: ChildrenElement; // specify children name to use
  }

  export type ChildrenElement = BElement | ChildrenElement[];

  export function createElement(
    type: any,
    props: Record<string, any>,
    ...children: BElement[]
  ) {
    if (!props) {
      props = {};
    }
    return {
      type,
      props,
      children,
    };
  }

  export function renderChild(child: ChildrenElement) {
    if (Array.isArray(child)) {
      //map类型
      child.forEach(renderChild);
      return;
    }
    if (child) {
      const tpc = typeof child;
      if (tpc == 'object') {
        const { type, props, children } = child as any;
        if (typeof type == 'string') {
          let node: any;
          delete props.children;
          if (isSVG(type)) {
            node = fsvg[type as 'svg'](props);
          } else {
            node = fdom[type as 'div'](props);
          }
          renderChildren(node, function () {
            children?.forEach(renderChild);
          });
        } else {
          props.children = children;
          const out = type(props);
          renderChild(out);
        }
      } else {
        renderTextContent(child as any);
      }
    } else {
      if (typeof child == 'number') {
        renderTextContent(child);
      }
    }
  }
  export function Fragment({ children }: any) {
    renderChild(children);
  }
}
