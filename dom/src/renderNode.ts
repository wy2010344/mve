import { BDomEvent, BSvgEvent, DomElement, DomElementType, domTagNames, FDomAttribute, FGetChildAttr, FSvgAttribute, renderFDomAttr, renderFSvgAttr, SvgElement, SvgElementType, svgTagNames } from "wy-dom-helper"
import { createOrProxy, emptyArray, EmptyFun, emptyObject } from "wy-helper"
import { hookAddResult, hookTrackAttr, OrFun, } from "mve-core"
import { renderChildren } from "./hookChildren"



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
export type Plugins<T> = {
  plugins?: ((div: T) => void)[]
}
export type WillRemove<T> = {
  willRemove?(node: T): any
}
export function addPlugins<T>(node: T, plugins: Plugins<T>) {
  if (plugins.plugins?.length) {
    plugins.plugins.forEach(plugin => plugin(node))
  }
}
export function addWillRemove<T>(node: T, willRemove: WillRemove<T>['willRemove']) {
  (node as any)._willRemove_ = willRemove
}
const ignoreKeys = [
  'plugins',
  'willRemove'
]
export type FPDomAttributes<T extends DomElementType> = OrFun<FDomAttribute<T>>
  & BDomEvent<T>
  & Plugins<DomElement<T>>
  & WillRemove<DomElement<T>>
export type FDomAttributes<T extends DomElementType> = FPDomAttributes<T> & FGetChildAttr<DomElement<T>>
export function renderFDom<T extends DomElementType>(
  type: T,
  arg: FDomAttributes<T> = emptyObject as any
): DomElement<T> {
  const node = document.createElement(type)
  renderFDomAttr(node, arg, mergeValue, renderChildren, ignoreKeys)
  hookAddResult(node)
  addPlugins(node, arg)
  addWillRemove(node, arg.willRemove)
  return node
}

export type FPSvgAttributes<T extends SvgElementType> = OrFun<FSvgAttribute<T>>
  & BSvgEvent<T>
  & Plugins<SvgElement<T>>
  & WillRemove<SvgElement<T>>
export type FSvgAttributes<T extends SvgElementType> = FPSvgAttributes<T>
  & FGetChildAttr<SvgElement<T>>
export function renderFSvg<T extends SvgElementType>(type: T, arg: FSvgAttributes<T> = emptyObject as any
): SvgElement<T> {
  const node = document.createElementNS("http://www.w3.org/2000/svg", type)
  renderFSvgAttr(node, arg, mergeValue, renderChildren, ignoreKeys)
  hookAddResult(node)
  addPlugins(node, arg)
  addWillRemove(node, arg.willRemove)
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