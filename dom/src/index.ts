import { render } from "mve-core"
import { EmptyFun } from "wy-helper"
import { renderPortal } from "./hookChildren"
export { dom } from './dom'
export { svg } from './svg'
export type { HookChild } from './hookChildren'
export { renderPortal, getRenderChildren, diffChangeChildren, hookCurrentParent } from './hookChildren'
export type { OrFun } from './hookChildren'
export type { StyleProps } from './node'
export * from './renderNode'
export function createRoot(node: Node, create: EmptyFun) {
  return render(() => {
    renderPortal(node, create)
  })
}
