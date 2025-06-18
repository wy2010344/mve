import { addEffect, emptyArray, EmptyFun, emptyFun, GetValue, memo, quote, SetValue, storeRef, trackSignal } from "wy-helper"
import { hookAddDestroy, hookAlterChildren, hookIsDestroyed } from "."







export function addTrackEffect<T>(get: GetValue<T>, toEffect: (v: T) => EmptyFun, level = 0) {
  const addDestroy = hookAddDestroy()
  addDestroy(trackSignal(get, v => {
    const effect = toEffect(v)
    addEffect(effect, level)
  }))
}

export function hookTrackAttr<V>(get: GetValue<V>, set: SetValue<V>, b?: any, f?: any) {
  const isDestroyed = hookIsDestroyed()
  const effect: {
    (): void
    v: any,
    b: any,
    f: any
  } = function () {
    if (isDestroyed()) {
      return
    }
    set(effect.v, effect.b, effect.f)
  } as any
  addTrackEffect(get, function (v) {
    effect.v = v
    effect.b = b
    effect.f = f
    return effect
  }, -1)
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
  const get = memo(function () {
    const newList: T[] = []
    purifyList(list, newList)
    return newList
  }, after)
  return get
}
export type RenderChildrenOperante<Node> = {
  moveBefore(parent: Node, newChild: Node, beforeChild: Node | null): void
  removeChild(parent: Node, child: Node): void
  nextSibling(child: Node): Node | null
}

export function createRenderChildren<T>(
  arg: RenderChildrenOperante<T>
) {
  return {
    renderPortal(
      pNode: T,
      fun: SetValue<T>
    ) {
      const list = storeRef<T[]>(emptyArray as T[])
      const addDestroy = hookAddDestroy()
      const getChildren = getRenderChildren<T, T>(fun, pNode);
      (getChildren as any).abc = (pNode as any).id
      hookChangeChildren(pNode, getChildren, quote, arg, list)
      addDestroy(() => {
        addEffect(() => {
          list.get().forEach(function (node) {
            arg.removeChild(pNode, node)
          })
        }, -2)
      })
      return getChildren
    },
    renderChildren(
      node: T,
      fun: SetValue<T>
    ) {
      const getChildren = getRenderChildren<T, T>(fun, node);
      (getChildren as any).abc = (node as any).id
      hookChangeChildren(node, getChildren, quote, arg)
      return getChildren
    }
  }
}
function hookChangeChildren<Node, T>(
  pNode: Node,
  getChildren: GetValue<readonly T[]>,
  get: (v: T) => Node,
  {
    moveBefore,
    removeChild,
    nextSibling
  }: RenderChildrenOperante<Node>,
  listRef = storeRef<readonly T[]>(emptyArray)
) {
  const isDestroyed = hookIsDestroyed()
  const effect: {
    (): void
    newList: readonly T[]
  } = function () {
    if (isDestroyed()) {
      return
    }
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
          moveBefore(pNode, newChild, beforeNode)
        } else if (beforeNode) {
          //beforeNode = beforeNode?.nextSibling
          beforeNode = nextSibling(beforeNode)
          // beforeIndex = beforeIndex + 1
          // const ol = oldList[beforeIndex]
          // beforeNode = ol ? get(ol) : null
        }
      } else {
        const ol = oldList[i]
        const lastChild = ol ? get(ol) : null
        if (newChild != lastChild) {
          changed = true
          moveBefore(pNode, newChild, lastChild)
          beforeNode = lastChild
        }
      }
    }
    oldList.forEach(last => {
      const lastChild = get(last)
      if (!newList.includes(last)) {
        // && lastChild.parentNode == pNode
        // lastChild.parentNode?.removeChild(lastChild)
        removeChild(pNode, lastChild)
      }
    })
    listRef.set(newList)
  } as any
  addTrackEffect(getChildren, function (list) {
    effect.newList = list
    return effect
  }, -2)
}