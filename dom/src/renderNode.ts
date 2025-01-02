import { BDomEvent, BSvgEvent, DomElement, DomElementType, FDomAttribute, FGetChildAttr, FSvgAttribute, renderFNodeAttr, SvgElement, SvgElementType } from "wy-dom-helper"
import { OrFun, renderChildren, renderPortal } from "./hookChildren"
import { emptyObject } from "wy-helper"
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


export function renderDom<T extends DomElementType>(type: T, arg: OrFun<FDomAttribute<T>>
  & BDomEvent<T>
  & FGetChildAttr<DomElement<T>> = emptyObject as any
): DomElement<T> {
  const node = document.createElement(type)
  renderFNodeAttr(node, arg, "dom", mergeValue, renderChildren)
  hookAddResult(node)
  return node
}
export function renderSvg<T extends SvgElementType>(type: T, arg: OrFun<FSvgAttribute<T>>
  & BSvgEvent<T>
  & FGetChildAttr<SvgElement<T>> = emptyObject as any
): SvgElement<T> {
  const node = document.createElementNS("http://www.w3.org/2000/svg", type)
  renderFNodeAttr(node, arg, "svg", mergeValue, renderChildren)
  hookAddResult(node)
  return node
}