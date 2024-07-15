import { render } from "mve-core"
import { createStoreValueCreater } from "./util"
export * from './html'
export * from './dom'
export * from './util'
export function createRoot(node: Node, reconcile: () => void) {
  return render(
    createStoreValueCreater(node),
    reconcile
  )
}
