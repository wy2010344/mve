import { BDomEvent, BSvgEvent, DomElement, DomElementType, domTagNames, FDomAttribute, FGetChildAttr, FSvgAttribute, renderFDomAttr, renderFSvgAttr, SvgElement, SvgElementType, svgTagNames } from "wy-dom-helper"
import { hookTrackAttr, OrFun, renderChildren } from "./hookChildren"
import { createOrProxy, emptyArray, emptyObject } from "wy-helper"
import { hookAddResult } from "mve-core"



export function mergeValue(
  node: any, value: any, setValue: any
) {
  const ext = arguments[3]
  if (typeof value == 'function') {
    hookTrackAttr(value, setValue, node, ext)
  } else {
    setValue(value, node, ext)
  }
}

export type FDomAttributes<T extends DomElementType> = OrFun<FDomAttribute<T>>
  & BDomEvent<T>
  & FGetChildAttr<DomElement<T>>
export function renderFDom<T extends DomElementType>(type: T, arg: FDomAttributes<T> = emptyObject as any
): DomElement<T> {
  const node = document.createElement(type)
  renderFDomAttr(node, arg, mergeValue, renderChildren, emptyArray)
  hookAddResult(node)
  return node
}

export type FSvgAttributes<T extends SvgElementType> = OrFun<FSvgAttribute<T>>
  & BSvgEvent<T>
  & FGetChildAttr<SvgElement<T>>
export function renderFSvg<T extends SvgElementType>(type: T, arg: FSvgAttributes<T> = emptyObject as any
): SvgElement<T> {
  const node = document.createElementNS("http://www.w3.org/2000/svg", type)
  renderFSvgAttr(node, arg, mergeValue, renderChildren, emptyArray)
  hookAddResult(node)
  return node
}


export const fdom: {
  readonly [key in DomElementType]: {
    (props?: FDomAttributes<key>): DomElement<key>
  }
} = createOrProxy(domTagNames, tag => {
  return function (args: any) {
    return renderFDom(tag, args)
  } as any
})

export const fsvg: {
  readonly [key in SvgElementType]: {
    (props?: FSvgAttributes<key>): SvgElement<key>
  }
} = createOrProxy(svgTagNames, tag => {
  return function (args: any) {
    return renderFSvg(tag, args)
  } as any
})