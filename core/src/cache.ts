import { EmptyFun, GetValue, SetValue, trackSignal } from "wy-helper"

const mve_global_key = "mve_global_key"
let gt = globalThis as any

const mveGlobal = (gt[mve_global_key] || {}) as {
  currentChildren?: any[]
  destroyList?: EmptyFun[]
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


export function hookAddDestroy(fun: EmptyFun) {
  const destroyList = mveGlobal.destroyList
  if (destroyList) {
    destroyList.push(fun)
  } else {
    throw '不在render执行添加到Destroy'
  }
}

export function hookAlterDestroyList(vs?: EmptyFun[]) {
  const before = mveGlobal.destroyList
  mveGlobal.destroyList = vs
  return before
}

