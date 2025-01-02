import { emptyArray, emptyFun, EmptyFun, GetValue, memo, quote, SetValue, storeRef } from "wy-helper"
import { hookAlterChildren } from "mve-core"
import { hookDestroy, hookTrackSignal, hookTrackSignalMemo } from "mve-helper"



export type OrFun<T extends {}> = {
  [key in keyof T]: T[key] | GetValue<T[key]>
}


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
    const before = g._mve_current_parent_
    g._mve_current_parent_ = n
    purifyList(list, newList)
    g._mve_current_parent_ = before
    return newList
  })
}

const g = globalThis as unknown as {
  _mve_current_parent_: any
}
export function hookCurrentParent<T = any>() {
  return g._mve_current_parent_ as T
}
export function renderPortal<T extends Node>(node: T, fun: SetValue<T>) {
  const list = storeRef<T[]>(emptyArray as T[])
  hookTrackSignal(
    getRenderChildren<T, T>(fun, node),
    diffChangeChildren(node, quote, emptyFun, list)
  )
  hookDestroy(() => {
    list.get().forEach(node => {
      node.parentNode?.removeChild(node)
    })
  })
}

export function renderChildren<T extends Node>(node: T, fun: SetValue<T>) {
  hookTrackSignal(
    getRenderChildren<T, T>(fun, node),
    diffChangeChildren(node, quote, emptyFun)
  )
}

export function diffChangeChildren<T>(
  pNode: Node,
  get: (v: T) => Node,
  operate: (v: T, i: number) => void,
  listRef = storeRef<T[]>(emptyArray as T[])
) {

  return function (
    newList: T[]
  ) {
    const oldList = listRef.get()
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
        const ol = oldList[i]
        const lastChild = ol ? get(ol) : null
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
    listRef.set(newList)
  }
}