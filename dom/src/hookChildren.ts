import { addEffect, emptyArray, emptyFun, GetValue, memo, quote, SetValue, storeRef } from "wy-helper"
import { hookAlterChildren } from "mve-core"
import { hookDestroy, hookTrackSignal } from "mve-helper"





export function hookTrackAttr<V>(get: GetValue<V>, set: SetValue<V>, b?: any, f?: any) {
  const effect: {
    (): void
    v: any,
    b: any,
    f: any
  } = function () {
    set(effect.v, effect.b, effect.f)
  } as any
  hookTrackSignal(get, (v) => {
    //在-1阶段更新属性
    effect.v = v
    effect.b = b
    effect.f = f
    addEffect(effect, -1)
  })
}

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

export function getRenderChildren<T, N>(fun: SetValue<N>, n: N, after: SetValue<T[]> = emptyFun) {
  const list: HookChild<T>[] = []
  const beforeList = hookAlterChildren(list)
  fun(n)
  hookAlterChildren(beforeList)
  const set = memo(function () {
    const newList: T[] = []
    purifyList(list, newList)
    return newList
  }, after)
  return set
}

export function renderPortal<T extends Node>(node: T, fun: SetValue<T>) {
  const list = storeRef<T[]>(emptyArray as T[])
  hookTrackSignal(
    getRenderChildren<T, T>(fun, node),
    diffChangeChildren(node, quote, list)
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
    diffChangeChildren(node, quote)
  )
}

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

export function diffChangeChildren<T>(
  pNode: Node,
  get: (v: T) => Node,
  listRef = storeRef<T[]>(emptyArray as T[])
) {
  //兼容最新的move-api
  const move = 'moveBefore' in pNode ? moveBefore : insertBefore

  const effect: {
    (): void
    newList: T[]
  } = function () {
    const newList = effect.newList
    //在-2时进行布局的重新整理
    const oldList = listRef.get()
    let changed = false
    let beforeNode: Node | null = null
    for (let i = 0; i < newList.length; i++) {
      const nl = newList[i]
      const newChild = get(nl)
      if (changed) {
        if (newChild != beforeNode) {
          move(pNode, newChild, beforeNode)
        } else {
          beforeNode = beforeNode?.nextSibling
        }
      } else {
        const ol = oldList[i]
        const lastChild = ol ? get(ol) : null
        if (newChild != lastChild) {
          changed = true
          move(pNode, newChild, lastChild)
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
  } as any
  return function (
    newList: T[]
  ) {
    effect.newList = newList
    addEffect(effect, -2)
  }
}