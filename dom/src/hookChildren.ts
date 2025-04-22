import { createRenderChildren } from "mve-core"
import { SetValue } from "wy-helper"






function insertBefore(parent: Node, newChild: Node, beforeNode: Node | null) {
  parent.insertBefore(newChild, beforeNode)
}
function moveBefore(parent: any, newChild: Node, beforeNode: Node | null) {
  if (newChild.parentNode != parent) {
    return insertBefore(parent, newChild, beforeNode)
  }
  if (beforeNode && beforeNode.parentNode != parent) {
    return insertBefore(parent, newChild, beforeNode)
  }
  parent.moveBefore(newChild, beforeNode)
}

const a = createRenderChildren<Node>({
  moveBefore: 'moveBefore' in document.body ? moveBefore : insertBefore,
  removeChild(parent, child) {
    if (child.parentNode == parent) {
      parent.removeChild(child)
    }
  },
  nextSibling(child) {
    return child.nextSibling
  },
})

export function renderChildren(n: Node, render: SetValue<Node>) {
  (n as any)._mve_children_ = a.renderChildren(n, render)
}

export const renderPortal = a.renderPortal