import { batchSignalEnd, EmptyFun, GetValue } from 'wy-helper'
import { hookAlterChildren, hookAlterStateHolder, hookCurrentStateHolder } from './cache'
import { StateHolder } from './stateHolder'

export * from './renderForEach'
export {
  hookAddResult, hookAddDestroy, hookAlterChildren,
  hookAlterStateHolder,
  hookCurrentStateHolder
} from './cache'
export { createContext } from './context'
export type { Context } from './context'
export * from './hookChildren'
export function render(create: EmptyFun) {
  const stateHolder = new StateHolder()
  hookAlterStateHolder(stateHolder)
  create()
  hookAlterStateHolder(undefined)
  batchSignalEnd()
  return () => {
    stateHolder.destroy()
  }
}

export function hookIsDestroyed() {
  return hookCurrentStateHolder()!.destroyed
}


export function renderStateHolder<T>(fun: GetValue<T>) {
  const c = hookCurrentStateHolder()!
  const before = hookAlterStateHolder(new StateHolder(
    c,
    c.contexts.length
  ))
  const o = fun()
  hookAlterStateHolder(before)
  return o
}

export function renderSubOps(fun: EmptyFun) {
  const children: any[] | undefined = []
  const beforeChildren = hookAlterChildren(children)
  fun()
  hookAlterChildren(beforeChildren)
  return function () {
    return children
  }
}