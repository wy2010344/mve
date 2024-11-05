import { render } from "mve-core"
import { EmptyFun } from "wy-helper"
import { hookBuildChildren } from "./hookChildren"
export { dom } from './dom'
export { svg } from './svg'
export function createRoot(node: Node, create: EmptyFun) {
  return render(() => {
    hookBuildChildren(node, create)
  })
}
