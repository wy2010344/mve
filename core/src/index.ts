import { FiberImpl, StoreValueCreater } from "./Fiber"
import { EnvModel } from "./commitWork"
import { AskNextTimeWork, alawaysTrue } from "wy-helper"
import { deepTravelFiber } from "./commitWork"
import { updateFunctionComponent } from "./fc"

export {
  hookLevelEffect,
  useLevelEffect, useBaseMemo,
  createContext, renderFiber,
  hookAddResult,
  hookEffectTag,
  hookRequestReconcile,
  hookMakeDirtyAndRequestUpdate
} from './fc'
export type { EffectResult, EffectEvent } from './fc'
export type {
  Fiber,
  RenderWithDep,
  MemoEvent,
  EffectDestroyEvent,
  StoreValueCreater,
  StoreValue
} from './Fiber'
export { isFiber } from './Fiber'
export * from './renderMapF'
export function render<T>(
  storeValueCreater: StoreValueCreater,
  render: () => void
) {
  const envModel = new EnvModel()
  const rootFiber = new FiberImpl(
    envModel,
    null!,
    storeValueCreater,
    alawaysTrue, {
    render,
    isNew: true,
    deps: undefined
  })
  envModel.reUpdate = function (fiber: FiberImpl | undefined) {
    while (fiber) {
      fiber = performUnitOfWork(fiber, envModel)
    }
    envModel.commit()
  }
  return function () {
    envModel.addDelect(rootFiber)
    envModel.reUpdate(rootFiber)
  }
}

/**
 * 当前工作结点，返回下一个工作结点
 * 先子，再弟，再父(父的弟)
 * 因为是IMGUI的进化版,只能深度遍历,不能广度遍历.
 * 如果子Fiber有返回值,则是有回流,则对于回流,父组件再怎么处理?像布局,是父组件收到回流,子组件会再render.也许从头绘制会需要这种hooks,只是哪些需要显露给用户
 * 深度遍历,render是前置的,执行完父的render,再去执行子的render,没有穿插的过程,或者后置的处理.亦即虽然子Fiber声明有先后,原则上是可以访问所有父的变量.
 * @param fiber 
 * @returns 
 */
const performUnitOfWork = deepTravelFiber<EnvModel[]>(function (fiber, envModel) {
  //当前fiber脏了，需要重新render
  if (fiber.effectTag) {
    updateFunctionComponent(fiber)
  }
})