import { EmptyFun, GetValue, SetValue, trackSignal } from "wy-helper"
import { StateHolder } from "./stateHolder"

const mve_global_key = "mve_global_key"
let gt = globalThis as any

const mveGlobal = (gt[mve_global_key] || {}) as {
  currentChildren?: any[]
  stateHolder?: StateHolder
}


export function hookAlterChildren(vs?: any[]) {
  const before = mveGlobal.currentChildren
  mveGlobal.currentChildren = vs
  return before
}

export function hookAddResult(node: any) {
  const children = mveGlobal.currentChildren
  if (children) {
    children.push(node)
  } else {
    throw '不在render执行添加到children'
  }
}


export function hookAddDestroy() {
  const stateHolder = mveGlobal.stateHolder
  if (stateHolder) {
    return stateHolder.addDestroy
  } else {
    throw '不在render中获得Destroy'
  }
}

// export function hookDestroy(fun: EmptyFun) {
//   const stateHolder = mveGlobal.stateHolder
//   if (stateHolder) {
//     return stateHolder.addDestroy(fun)
//   } else {
//     throw '不在render执行添加到Destroy'
//   }
// }

export function hookAlterStateHolder(stateHolder?: StateHolder) {
  const before = mveGlobal.stateHolder
  mveGlobal.stateHolder = stateHolder
  return before
}

export function hookCurrentStateHolder() {
  return mveGlobal.stateHolder
}