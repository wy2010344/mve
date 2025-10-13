import {
  BDomEvent,
  BSvgEvent,
  DomElement,
  DomElementType,
  domTagNames,
  FDomAttribute,
  FGetChildAttr,
  FSvgAttribute,
  renderMDomAttr,
  renderMSvgAttr,
  SvgElement,
  SvgElementType,
  svgTagNames,
  GDomAttribute,
  renderGDomAttr,
} from 'wy-dom-helper';
import { createOrProxy } from 'wy-helper';
import { hookAddResult } from 'mve-core';
import {
  addWillRemove,
  mergeValue,
  WillRemove,
  Plugin,
  addPlugin,
} from './renderNode';
import { renderChildren } from './hookChildren';

export type ZDomAttributes<T extends DomElementType> = {
  attrsNoObserver?: boolean;
  attrs?(m: FDomAttribute<T>): void;
} & BDomEvent<T> &
  Plugin<DomElement<T>> &
  FGetChildAttr<DomElement<T>> &
  WillRemove<DomElement<T>>;
export function renderZDom<T extends DomElementType>(
  type: T,
  arg: ZDomAttributes<T>
) {
  const node = document.createElement(type);
  renderMDomAttr(node, arg, mergeValue, renderChildren);
  hookAddResult(node);
  addPlugin(node, arg);
  addWillRemove(node, arg.willRemove);
  return node;
}

export type GDomAttributes<T extends DomElementType> = {
  attrsNoObserver?: boolean;
  attrs?(m: GDomAttribute<T>): void;
} & BDomEvent<T> &
  Plugin<DomElement<T>> &
  FGetChildAttr<DomElement<T>> &
  WillRemove<DomElement<T>>;
export function renderGDom<T extends DomElementType>(
  type: T,
  arg: GDomAttributes<T>
) {
  const node = document.createElement(type);
  renderGDomAttr(node, arg, mergeValue, renderChildren);
  hookAddResult(node);
  addPlugin(node, arg);
  addWillRemove(node, arg.willRemove);
  return node;
}

export type ZSvgAttributes<T extends SvgElementType> = {
  attrsNoObserver?: boolean;
  attrs?(m: FSvgAttribute<T>): void;
} & BSvgEvent<T> &
  Plugin<SvgElement<T>> &
  FGetChildAttr<SvgElement<T>> &
  WillRemove<SvgElement<T>>;
export function renderZSvg<T extends SvgElementType>(
  type: T,
  arg: ZSvgAttributes<T>
) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', type);
  renderMSvgAttr(node, arg, mergeValue, renderChildren);
  hookAddResult(node);
  addPlugin(node, arg);
  addWillRemove(node, arg.willRemove);
  return node;
}

export const gdom: {
  readonly [key in DomElementType]: {
    (props?: GDomAttributes<key>): DomElement<key>;
  };
} = createOrProxy(domTagNames, tag => {
  return function (args: any) {
    return renderGDom(tag, args);
  } as any;
});

export const zdom: {
  readonly [key in DomElementType]: {
    (props?: ZDomAttributes<key>): DomElement<key>;
  };
} = createOrProxy(domTagNames, tag => {
  return function (args: any) {
    return renderZDom(tag, args);
  } as any;
});

export const zsvg: {
  readonly [key in SvgElementType]: {
    (props?: ZSvgAttributes<key>): SvgElement<key>;
  };
} = createOrProxy(svgTagNames, tag => {
  return function (args: any) {
    return renderZSvg(tag, args);
  } as any;
});
