import { Fiber, StoreValueCreater, hookAddResult, renderFiber } from "mve-core";
import { arrayNotEqualDepsWithEmpty } from "wy-helper";
import { arrayStoreCreater } from "./util";


export function createRenderFragment(storeValueCreater: StoreValueCreater) {
  function renderFragment<T extends readonly any[] = any[]>(
    fun: (old: T | undefined, isNew: boolean, nv: T) => void, dep: T, asPortal?: boolean): Fiber
  function renderFragment(
    fun: (old: undefined, isNew: boolean, nv: undefined) => void): void
  function renderFragment() {
    const [render, deps, asPortal] = arguments
    const fiber = renderFiber(storeValueCreater, arrayNotEqualDepsWithEmpty, render, deps)
    if (asPortal) {
      return fiber
    }
    hookAddResult(fiber)
  }
  return renderFragment
}

export const renderFragment = createRenderFragment(arrayStoreCreater)