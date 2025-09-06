import {
  addEffect,
  emptyArray,
  EmptyFun,
  emptyFun,
  GetValue,
  memo,
  MemoFun,
  objectFreeze,
  quote,
  SetValue,
  StoreRef,
  storeRef,
  trackSignal,
  collectSignal,
} from 'wy-helper'
import { hookAddDestroy, hookAlterChildren, hookIsDestroyed } from '.'

export function addTrackEffect<T>(
  get: GetValue<T>,
  toEffect: (v: T) => EmptyFun,
  level = 0
) {
  const addDestroy = hookAddDestroy()
  addDestroy(
    trackSignal(get, (v) => {
      const effect = toEffect(v)
      addEffect(effect, level)
    })
  )
}

export function hookTrackAttr<V>(
  get: GetValue<V>,
  set: SetValue<V>,
  b?: any,
  f?: any
) {
  /**
   * 属性节点依赖子节点构造出结构
   */
  const isDestroyed = hookIsDestroyed()
  function effect() {
    if (isDestroyed()) {
      return
    }
    const value = collect(get)
    if (value != lastValue) {
      lastValue = value
      set(value, b, f)
    }
  }
  let lastValue: any = effect
  const { destroy, collect } = collectSignal(function () {
    addEffect(effect, -1)
  })
  hookAddDestroy()(destroy)
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

function getRenderChildrenList<T>(list: HookChild<T>[], after: SetValue<T[]>) {
  const get = memo(function () {
    objectFreeze(list)
    const newList: T[] = []
    purifyList(list, newList)
    return newList
  }, after)
  return get
}

/**
 * 这个可以在canvas中实践
 */
export class AppendList<T, N> {
  private list: HookChild<T>[] = []
  constructor(
    public readonly node: N,
    private readonly after: SetValue<T[]> = emptyFun
  ) {
    this.target = getRenderChildrenList(this.list, this.after)
  }

  readonly target: MemoFun<T[]>

  collect<T = void>(fun: (n: N) => T) {
    const beforeList = hookAlterChildren(this.list)
    const before = m._mve_current_parent_node
    m._mve_current_parent_node = this.node
    const o = fun(this.node)
    m._mve_current_parent_node = before
    hookAlterChildren(beforeList)
    return o
  }
}
const m = globalThis as unknown as {
  _mve_current_parent_node: any
}
export function hookCurrentParent() {
  return m._mve_current_parent_node
}
export type RenderChildrenOperante<Node> = {
  moveBefore(parent: Node, newChild: Node, beforeChild: Node | null): void
  removeChild(parent: Node, child: Node): void
  nextSibling(child: Node): Node | null
}

export function createRenderChildren<T>(arg: RenderChildrenOperante<T>) {
  return {
    renderPortal(pNode: T, fun: SetValue<T>) {
      const list = storeRef<T[]>(emptyArray as T[])
      const addDestroy = hookAddDestroy()
      const appendList = new AppendList(pNode)
      appendList.collect(fun)
      hookChangeChildren(pNode, appendList.target, quote, arg, list)
      addDestroy(() => {
        addEffect(() => {
          list.get().forEach(function (node) {
            arg.removeChild(pNode, node)
          })
          list.get().length = 0
          list.set(emptyArray)
        }, -2)
      })
      return appendList
    },
    renderChildren(node: T, fun: SetValue<T>) {
      const appendList = new AppendList(node)
      appendList.collect(fun)
      hookChangeChildren(node, appendList.target, quote, arg)
      return appendList
    },
  }
}
function hookChangeChildren<Node, T>(
  pNode: Node,
  getChildren: GetValue<readonly T[]>,
  get: (v: T) => Node,
  { moveBefore, removeChild, nextSibling }: RenderChildrenOperante<Node>,
  listRef?: StoreRef<readonly T[]>
) {
  const autoClear = !listRef
  listRef = listRef || storeRef<readonly T[]>(emptyArray)
  const isDestroyed = hookIsDestroyed()
  const effect: {
    (): void
    newList: readonly T[]
  } = function () {
    if (isDestroyed()) {
      if (autoClear) {
        listRef.set(emptyArray)
      }
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
          beforeNode = nextSibling(beforeNode)
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
    oldList.forEach((last) => {
      const lastChild = get(last)
      if (!newList.includes(last)) {
        removeChild(pNode, lastChild)
      }
    })
    listRef.set(newList)
  } as any
  addTrackEffect(
    getChildren,
    function (list) {
      effect.newList = list
      return effect
    },
    -2
  )
}
