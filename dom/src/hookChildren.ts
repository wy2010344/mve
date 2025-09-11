import { AppendList, createRenderChildren } from 'mve-core'
import { SetValue } from 'wy-helper'

function insertBefore(parent: Node, newChild: Node, beforeNode: Node | null) {
  if (newChild.parentNode == parent && newChild.nextSibling == beforeNode) {
    return
  }
  parent.insertBefore(newChild, beforeNode)
}
function moveBefore(parent: any, newChild: Node, beforeNode: Node | null) {
  if (!newChild.parentNode) {
    //强制重绘.没有用...
    ;(newChild as any).scrollTop
  }
  if (newChild.parentNode != parent) {
    return insertBefore(parent, newChild, beforeNode)
  }
  if (beforeNode && beforeNode.parentNode != parent) {
    return insertBefore(parent, newChild, beforeNode)
  }
  parent.moveBefore(newChild, beforeNode)
}

const a = createRenderChildren<Node>({
  moveBefore: insertBefore, //'moveBefore' in document.body ? moveBefore :
  removeChild(parent, child) {
    if (child.parentNode == parent) {
      const willRemove = (child as any)._willRemove_
      if (willRemove) {
        const p = willRemove(child)
        if (p && p instanceof Promise) {
          p.finally(() => {
            parent.removeChild(child)
          })
        } else {
          parent.removeChild(child)
        }
      } else {
        parent.removeChild(child)
      }
    }
  },
  nextSibling(child) {
    return child.nextSibling
  },
  firstChild(child: Node) {
    return child.firstChild
  },
})

export function renderChildren(n: Node, render: SetValue<Node>) {
  ;(n as any)._mve_children_ = a.renderChildren(n, render)
}

export function collect<T extends Node, V = void>(n: T, fun: (n: T) => V) {
  const _mve_children_ = (n as any)._mve_children_ as AppendList<Node, T>
  if (!_mve_children_) {
    throw '非定义节点'
  }
  return _mve_children_.collect(fun)
}

export const renderPortal = a.renderPortal
