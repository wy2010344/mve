import { BDomEvent, BSvgEvent, DomElement, DomElementType, domTagNames, FDomAttribute, FGetChildAttr, FSvgAttribute, renderFNodeAttr, SvgElement, SvgElementType, svgTagNames } from "wy-dom-helper"
import { OrFun, renderChildren } from "./hookChildren"
import { createOrProxy, emptyObject } from "wy-helper"
import { hookTrackSignalMemo } from "mve-helper"
import { hookAddResult } from "mve-core"



function mergeValue(
  node: any, value: any, setValue: any
) {
  const ext = arguments[3]
  if (typeof value == 'function') {
    hookTrackSignalMemo(value, setValue, node, ext)
  } else {
    setValue(value, node, ext)
  }
}

export type FDomAttributes<T extends DomElementType> = OrFun<FDomAttribute<T>>
  & BDomEvent<T>
  & FGetChildAttr<DomElement<T>>
export function renderDom<T extends DomElementType>(type: T, arg: FDomAttributes<T> = emptyObject as any
): DomElement<T> {
  const node = document.createElement(type)
  renderFNodeAttr(node, arg, "dom", mergeValue, renderChildren)
  hookAddResult(node)
  return node
}

export type FSvgAttributes<T extends SvgElementType> = OrFun<FSvgAttribute<T>>
  & BSvgEvent<T>
  & FGetChildAttr<SvgElement<T>>
export function renderSvg<T extends SvgElementType>(type: T, arg: FSvgAttributes<T> = emptyObject as any
): SvgElement<T> {
  const node = document.createElementNS("http://www.w3.org/2000/svg", type)
  renderFNodeAttr(node, arg, "svg", mergeValue, renderChildren)
  hookAddResult(node)
  return node
}


export const fdom: {
  readonly [key in DomElementType]: {
    (props?: FDomAttributes<key>): DomElement<key>
  }
} = createOrProxy(domTagNames, tag => {
  return function (args: any) {
    return renderDom(tag, args)
  } as any
})

export const fsvg: {
  readonly [key in SvgElementType]: {
    (props?: FSvgAttributes<key>): SvgElement<key>
  }
} = createOrProxy(svgTagNames, tag => {
  return function (args: any) {
    return renderSvg(tag, args)
  } as any
})