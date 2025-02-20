import { BDomEvent, BSvgEvent, DomElement, DomElementType, domTagNames, FDomAttribute, FGetChildAttr, FSvgAttribute, renderMDomAttr, renderMSvgAttr, SvgElement, SvgElementType, svgTagNames } from "wy-dom-helper";
import { SetValue, createOrProxy } from "wy-helper";
import { hookTrackAttr, renderChildren } from "./hookChildren";
import { hookAddResult } from "mve-core";
import { mergeValue } from "./renderNode";





export type MDomAttributes<T extends DomElementType> = {
  attrs?: FDomAttribute<T> | SetValue<FDomAttribute<T>>
} & BDomEvent<T>
  & FGetChildAttr<DomElement<T>>
export function renderMDom<T extends DomElementType>(
  type: T,
  arg: MDomAttributes<T>
) {
  const node = document.createElement(type)
  renderMDomAttr(node, arg, mergeValue, renderChildren)
  hookAddResult(node)
  return node
}



export type MSvgAttributes<T extends SvgElementType> = {
  attrs?: FSvgAttribute<T> | SetValue<FSvgAttribute<T>>
} & BSvgEvent<T>
  & FGetChildAttr<SvgElement<T>>
export function renderMSvg<T extends SvgElementType>(
  type: T,
  arg: MSvgAttributes<T>
) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", type)
  renderMSvgAttr(node, arg, mergeValue, renderChildren)
  hookAddResult(node)
  return node
}



export const mdom: {
  readonly [key in DomElementType]: {
    (props?: MDomAttributes<key>): DomElement<key>
  }
} = createOrProxy(domTagNames, tag => {
  return function (args: any) {
    return renderMDom(tag, args)
  } as any
})

export const msvg: {
  readonly [key in SvgElementType]: {
    (props?: MSvgAttributes<key>): SvgElement<key>
  }
} = createOrProxy(svgTagNames, tag => {
  return function (args: any) {
    return renderMSvg(tag, args)
  } as any
})