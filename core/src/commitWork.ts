import { FiberImpl } from "./Fiber"
import { EmptyFun, emptyFun, iterableToList, run } from "wy-helper"
/**
 * 涉及修改ref
 * useEffect里面可以直接执行
 * 主要是promise等外部事件,恰好在render中
 *   非render时可以立即执行.
 *   否则得在render完成后执行.
 */
export class EnvModel {
  reUpdate: (fiber: FiberImpl) => void = emptyFun
  private onWork: boolean | 'commit' = false
  setOnWork(isCommit?: boolean) {
    this.onWork = isCommit ? 'commit' : true
  }
  isOnWork() {
    return this.onWork
  }
  finishWork() {
    this.onWork = false
  }
  /**本次等待删除的fiber*/
  private readonly deletions: FiberImpl[] = []
  addDelect(fiber: FiberImpl) {
    this.deletions.push(fiber)
  }
  private updateEffects = new Map<number, EmptyFun[]>()
  updateEffect(level: number, set: EmptyFun) {
    const old = this.updateEffects.get(level)
    const array = old || []
    if (!old) {
      this.updateEffects.set(level, array)
    }
    array.push(set)
  }
  constructor() { }
  shouldRender() {
    //changeAtoms说明有状态变化,deletions表示,比如销毁
    return this.deletions.length > 0 || this.updateEffects.size
  }

  rollback() {
    this.deletions.length = 0
    this.updateEffects.clear()
  }
  commit() {
    /******清理删除********************************************************/
    /******清理所有的draft********************************************************/
    // checkRepeat(deletions)
    this.deletions.forEach(notifyDel)
    this.deletions.length = 0
    // /******更新属性********************************************************/
    // updateFixDom(rootFiber)

    //执行所有effect
    const updateEffects = this.updateEffects
    const keys = iterableToList(updateEffects.keys()).sort()
    for (const key of keys) {
      updateEffects.get(key)?.forEach(run)
    }
    updateEffects.clear()
  }
}
/**
 * portal内的节点不会找到portal外，portal外的节点不会找到portal内。
 * 即向前遍历，如果该节点是portal，跳过再向前
 * 向上遍历，如果该节点是portal，不再向上---本来不会再向上。
 * @param fiber 
 * @returns 
 */

function notifyDel(fiber: FiberImpl) {
  destroyFiber(fiber)
  const child = fiber.firstChild
  if (child) {
    let next: FiberImpl | void = child
    while (next) {
      notifyDel(next)
      next = next.next
    }
  }
}
function destroyFiber(fiber: FiberImpl) {
  fiber.destroyed = true
  const effects = fiber.hookEffects
  if (effects) {
    const keys = iterableToList(effects.keys()).sort()
    for (const key of keys) {
      effects.get(key)?.forEach(effect => {
        const destroy = effect.destroy
        if (destroy) {
          destroy(effect.deps)
        }
      })
    }
  }
  // fiber.dom?.destroy()
}



export function deepTravelFiber<T extends any[]>(call: (Fiber: FiberImpl, ...vs: T) => void) {
  return function (fiber: FiberImpl, ...vs: T) {
    call(fiber, ...vs)
    const child = fiber.firstChild
    if (child) {
      return child
    }
    /**寻找叔叔节点 */
    let nextFiber: FiberImpl | undefined = fiber
    while (nextFiber) {
      const next = nextFiber.next
      if (next) {
        return next
      }
      nextFiber = nextFiber.parent
    }
    return undefined
  }
}