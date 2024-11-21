import { emptyArray, SetValue } from "wy-helper"
import { hookAlterChildren } from "mve-core"
import { hookTrackSignal } from "mve-helper"





export type HookChild = Node | (() => HookChild[])




function purifyList(children: HookChild[], list: Node[]) {
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (typeof child == 'function') {
      purifyList(child(), list)
    } else {
      list.push(child)
    }
  }
}

export function renderPortal<T extends Node>(node: T, fun: SetValue<T>) {
  const list: HookChild[] = []
  const beforeList = hookAlterChildren(list)
  fun(node)
  hookAlterChildren(beforeList)
  let lastList = emptyArray as Node[]
  hookTrackSignal(() => {
    const newList: Node[] = []
    purifyList(list, newList)
    return newList
  }, (newList) => {
    lastList = changeChildren(node, newList, lastList)
  })
}


function changeChildren(pNode: Node, newList: Node[], oldList: Node[]) {
  let changed = false
  let beforeNode: Node | null = null
  for (let i = 0; i < newList.length; i++) {
    const newChild = newList[i]
    if (changed) {
      if (newChild != beforeNode) {
        pNode.insertBefore(newChild, beforeNode)
      } else {
        beforeNode = beforeNode?.nextSibling
      }
    } else {
      const lastChild = oldList[i]
      if (newChild != lastChild) {
        changed = true
        pNode.insertBefore(newChild, lastChild)
        beforeNode = lastChild
      }
    }
  }
  oldList.forEach(lastChild => {
    if (!newList.includes(lastChild) && lastChild.parentNode == pNode) {
      lastChild.parentNode?.removeChild(lastChild)
    }
  })
  return newList
}