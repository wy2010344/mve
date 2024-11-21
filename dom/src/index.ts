import { render } from "mve-core"
import { EmptyFun } from "wy-helper"
import { renderPortal } from "./hookChildren"
export { dom } from './dom'
export { svg } from './svg'
export { renderPortal }
export function createRoot(node: Node, create: EmptyFun) {
  return render(() => {
    renderPortal(node, create)
  })
}
