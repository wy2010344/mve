import { BDomEvent, BSvgEvent, DomElement, DomElementType, FChildAttr, FDomAttribute, FSvgAttribute, getAttributeAlias, renderFNodeAttr, SvgElement, SvgElementType } from "wy-dom-helper"
import { OrFun, renderPortal } from "./hookChildren"
import { emptyObject, GetValue, SetValue } from "wy-helper"
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
  & FChildAttr<DomElement<T>> = emptyObject as any
): DomElement<T> {
  const node = document.createElement(type)
  renderFNodeAttr(node, arg, "dom", mergeValue, renderPortal)
  hookAddResult(node)
  return node
}
export function renderSvg<T extends SvgElementType>(type: T, arg: OrFun<FSvgAttribute<T>>
  & BSvgEvent<T>
  & FChildAttr<SvgElement<T>> = emptyObject as any
): SvgElement<T> {
  const node = document.createElementNS("http://www.w3.org/2000/svg", type)
  renderFNodeAttr(node, arg, "svg", mergeValue, renderPortal)
  hookAddResult(node)
  return node
}