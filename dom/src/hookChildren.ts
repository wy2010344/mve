import { emptyArray, emptyFun, EmptyFun, memo, quote, SetValue } from "wy-helper"
import { hookAlterChildren } from "mve-core"
import { hookTrackSignal, hookTrackSignalMemo } from "mve-helper"





export type HookChild<T> = T | (() => HookChild<T>[])




function purifyList<T>(children: HookChild<T>[], list: T[]) {
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (typeof child == 'function') {
      purifyList((child as any)(), list)
    } else {
      list.push(child)
    }
  }
}

export function getRenderChildren<T, N>(fun: SetValue<N>, n: N) {
  const list: HookChild<T>[] = []
  const beforeList = hookAlterChildren(list)
  fun(n)
  hookAlterChildren(beforeList)
  return memo(function () {
    const newList: T[] = []
    purifyList(list, newList)
    return newList
  })
}

export function renderPortal<T extends Node>(node: T, fun: SetValue<T>) {
  hookTrackSignal(
    getRenderChildren<T, T>(fun, node),
    diffChangeChildren(node, quote, emptyFun)
  )
}

export function diffChangeChildren<T>(
  pNode: Node,
  get: (v: T) => Node,
  operate: (v: T, i: number) => void
) {
  let oldList: T[] = emptyArray as T[]
  return function (
    newList: T[]
  ) {
    let changed = false
    let beforeNode: Node | null = null
    for (let i = 0; i < newList.length; i++) {
      const nl = newList[i]
      operate(nl, i)
      const newChild = get(nl)
      if (changed) {
        if (newChild != beforeNode) {
          pNode.insertBefore(newChild, beforeNode)
        } else {
          beforeNode = beforeNode?.nextSibling
        }
      } else {
        const lastChild = get(oldList[i])
        if (newChild != lastChild) {
          changed = true
          pNode.insertBefore(newChild, lastChild)
          beforeNode = lastChild
        }
      }
    }
    oldList.forEach(last => {
      const lastChild = get(last)
      if (!newList.includes(last) && lastChild.parentNode == pNode) {
        lastChild.parentNode?.removeChild(lastChild)
      }
    })
    oldList = newList
  }
}