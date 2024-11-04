import { EmptyFun, GetValue, SetValue, trackSignal } from "wy-helper"
import { HookChild } from "./hookChildren"

const mve_global_key = "mve_global_key"
let gt = globalThis as any

const mveGlobal = (gt[mve_global_key] || {}) as {
  currentChildren?: HookChild[]

  destroyList?: EmptyFun[]
}


export function hookAlterChildren(vs?: HookChild[]) {
  const before = mveGlobal.currentChildren
  mveGlobal.currentChildren = vs
  return before
}

export function hookAddResult(node: HookChild) {
  const children = mveGlobal.currentChildren
  if (children) {
    children.push(node)
  } else {
    throw '不在render执行添加到children'
  }
}


export function hookAddDestroy(fun: EmptyFun) {
  const destroyList = mveGlobal.destroyList
  if (destroyList) {
    destroyList.push(fun)
  } else {
    throw '不在render执行添加到children'
  }
}

export function hookAlterDestroyList(vs?: EmptyFun[]) {
  const before = mveGlobal.destroyList
  mveGlobal.destroyList = vs
  return before
}


export function hookTrackSignal<T>(get: GetValue<T>, set: SetValue<T>) {
  hookAddDestroy(trackSignal(get, set))
}