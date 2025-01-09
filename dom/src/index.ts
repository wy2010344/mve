import { hookAddResult, render } from "mve-core"
import { EmptyFun, genTemplateStringS1, genTemplateStringS2, ValueOrGet, VType, vTypeisGetValue } from "wy-helper"
import { renderPortal } from "./hookChildren"
import { hookTrackSignalMemo } from "mve-helper"
export { dom } from './dom'
export { svg } from './svg'
export type { HookChild } from './hookChildren'
export { renderPortal, getRenderChildren, diffChangeChildren } from './hookChildren'
export type { OrFun } from './hookChildren'
export type { StyleProps } from './node'
export * from './renderNode'
export function createRoot(node: Node, create: EmptyFun) {
  return render(() => {
    renderPortal(node, create)
  })
}


export function renderTextContent(value: ValueOrGet<string | number>) {
  const node = document.createTextNode('')
  hookAddResult(node)
  if (typeof value == 'function') {
    hookTrackSignalMemo(() => {
      node.textContent = (value as any)()
    })
  } else {
    node.textContent = value + ''
  }
  return node
}


export function renderText(ts: TemplateStringsArray, ...vs: VType[]) {
  const node = document.createTextNode('')
  if (vs.some(vTypeisGetValue)) {
    hookTrackSignalMemo(() => {
      node.textContent = genTemplateStringS2(ts, vs)
    })
  } else {
    node.textContent = genTemplateStringS1(ts, vs as any)
  }
  return node
}