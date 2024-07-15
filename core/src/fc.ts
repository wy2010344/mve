import { Fiber } from "./Fiber";
import { EffectDestroyEvent, FiberImpl, StoreValueCreater, HookEffect, MemoEvent, RenderWithDep, StoreValue } from "./Fiber";
import { quote, simpleNotEqual, alawaysTrue, ValueCenter, valueCenterOf, arrayNotEqual, EmptyFun } from "wy-helper";

const w = globalThis as any
const cache = (w.__better_react_one__ || {
  wipFiber: undefined,
  allowWipFiber: false
}) as {
  wipFiber?: FiberImpl
  allowWipFiber?: boolean
}
w.__better_react_one__ = cache




export function hookParentFiber() {
  if (cache.allowWipFiber) {
    return cache.wipFiber!
  }
  console.error('禁止在此处访问fiber')
  throw new Error('禁止在此处访问fiber')
}
export function draftParentFiber() {
  cache.allowWipFiber = false
}
export function revertParentFiber() {
  cache.allowWipFiber = true
}
const hookIndex = {
  effects: new Map<number, number>(),
  memo: 0,
  result: undefined as unknown as StoreValue<any>,
  beforeFiber: undefined as (FiberImpl | undefined),
}
export function updateFunctionComponent(fiber: FiberImpl) {
  revertParentFiber()
  cache.wipFiber = fiber

  hookIndex.effects.clear()
  hookIndex.memo = 0
  hookIndex.result = fiber.storeValueCreater()
  hookIndex.beforeFiber = undefined
  fiber.render(hookIndex.result)
  draftParentFiber();
  hookIndex.result = undefined as any
  cache.wipFiber = undefined
}

export type EffectResult<T> = (void | ((e: EffectDestroyEvent<T>) => void))
export type EffectEvent<T> = {
  trigger: T
  isInit: boolean
  beforeTrigger?: T
}
/**
 * 必须有个依赖项,如果没有依赖项,如果组件有useFragment,则会不执行,造成不一致.
 * useMemo如果无依赖,则不需要使用useMemo,但useEffect没有依赖,仍然有意义.有依赖符合幂等,无依赖不需要幂等.
 * @param effect 
 * @param deps 
 */
export function useLevelEffect<T>(
  level: number,
  shouldChange: (a: T, b: T) => any,
  effect: (e: EffectEvent<T>) => EffectResult<T>, deps: T): void {
  const parentFiber = hookParentFiber()
  const isInit = parentFiber.effectTag == 'PLACEMENT'
  if (isInit) {
    //新增
    const hookEffects = parentFiber.hookEffects || new Map()
    parentFiber.hookEffects = hookEffects
    const hookEffect: HookEffect<T> = {
      deps,
      isInit,
      shouldChange
    }
    const old = hookEffects.get(level)
    const array = old || []
    if (!old) {
      hookEffects.set(level, array)
    }
    array.push(hookEffect)
    parentFiber.envModel.updateEffect(level, () => {
      hookEffect.destroy = effect({
        beforeTrigger: undefined,
        isInit, trigger: deps
      })
    })
  } else {
    const hookEffects = parentFiber.hookEffects
    if (!hookEffects) {
      throw new Error("原组件上不存在hookEffects")
    }
    const index = hookIndex.effects.get(level) || 0
    const levelEffect = hookEffects.get(level)
    if (!levelEffect) {
      throw new Error(`未找到该level effect ${level}`)
    }
    const oldEffect = levelEffect[index]
    if (!oldEffect) {
      throw new Error("出现了更多的effect")
    }
    if (oldEffect.shouldChange != shouldChange) {
      throw new Error('shouldChange发生改变')
    }
    hookIndex.effects.set(level, index + 1)
    if (shouldChange(oldEffect.deps, deps)) {
      const newEffect: HookEffect<T> = {
        deps,
        isInit: false,
        shouldChange
      }
      levelEffect[index] = newEffect
      parentFiber.envModel.updateEffect(level, () => {
        if (oldEffect.destroy) {
          oldEffect.destroy({
            trigger: deps,
            beforeIsInit: oldEffect.isInit,
            beforeTrigger: oldEffect.deps
          })
        }
        newEffect.destroy = effect({
          beforeTrigger: oldEffect.deps,
          isInit,
          trigger: deps
        })
      })
    }
  }
}


export function hookLevelEffect(
  level: number,
  effect: EmptyFun
) {

  const parentFiber = hookParentFiber()
  parentFiber.envModel.updateEffect(level, effect)
}

export function hookAddResult(...vs: any[]) {
  hookIndex.result.hookAddResult(...vs)
}
/**
 * 通过返回函数,能始终通过函数访问fiber上的最新值
 * @param effect 
 * @param deps 
 * @returns 
 */
export function useBaseMemo<T, V>(
  shouldChange: (a: V, b: V) => any,
  effect: (e: MemoEvent<V>) => T,
  deps: V,
): T {
  const parentFiber = hookParentFiber()
  const isInit = parentFiber.effectTag == "PLACEMENT"
  if (isInit) {
    const hookMemos = parentFiber.hookMemo || []
    parentFiber.hookMemo = hookMemos

    draftParentFiber()
    const state = {
      value: effect({
        isInit,
        trigger: deps
      }),
      deps
    }
    revertParentFiber()
    hookMemos.push({
      value: state,
      shouldChange
    })
    return state.value
  } else {
    const hookMemos = parentFiber.hookMemo
    if (!hookMemos) {
      throw new Error("原组件上不存在memos")
    }
    const index = hookIndex.memo
    const hook = hookMemos[index]
    if (!hook) {
      throw new Error("出现了更多的memo")
    }
    if (hook.shouldChange != shouldChange) {
      throw new Error("shouldChange发生改变")
    }
    hookIndex.memo = index + 1
    const state = hook.value
    if (hook.shouldChange(state.deps, deps)) {
      //不处理
      draftParentFiber()
      const newState = {
        value: effect({
          beforeTrigger: state.deps,
          isInit: false,
          trigger: deps
        }),
        deps
      }
      revertParentFiber()

      hook.value = newState
      return newState.value
    }
    return state.value
  }
}
export function renderFiber<T>(
  storeValueCreater: StoreValueCreater,
  ...[shouldChange, render, deps]: RenderWithDep<T>
): Fiber {
  const parentFiber = hookParentFiber()
  let currentFiber: FiberImpl
  const isInit = parentFiber.effectTag == 'PLACEMENT'
  if (isInit) {
    //新增
    currentFiber = new FiberImpl(
      parentFiber.envModel,
      parentFiber,
      storeValueCreater,
      shouldChange,
      {
        render,
        deps,
        isNew: true,
      })
    currentFiber.before = (hookIndex.beforeFiber)
    //第一次要标记sibling
    if (hookIndex.beforeFiber) {
      hookIndex.beforeFiber.next = (currentFiber)
    } else {
      parentFiber.firstChild = (currentFiber)
    }
    //一直组装到最后
    parentFiber.lastChild = (currentFiber)
    hookIndex.beforeFiber = currentFiber

  } else {
    //修改
    let oldFiber: FiberImpl | void = undefined
    if (hookIndex.beforeFiber) {
      oldFiber = hookIndex.beforeFiber.next
    }
    if (!oldFiber) {
      oldFiber = parentFiber.firstChild
    }
    if (!oldFiber) {
      throw new Error("非预期地多出现了fiber")
    }
    if (oldFiber.storeValueCreater != storeValueCreater) {
      throw new Error("FiberConfig发生改变")
    }
    if (oldFiber.shouldChange != shouldChange) {
      throw new Error("shouldChange发生改变")
    }
    currentFiber = oldFiber

    hookIndex.beforeFiber = currentFiber
    currentFiber.changeRender(render, deps)
  }
  return currentFiber
}
export interface Context<T> {
  hookProvider(v: T): void
  /**
   * 似乎不能hookSelector,因为transition中闪建的节点,
   * @param getValue 
   * @param shouldUpdate 
   */
  useSelector<M>(getValue: (v: T) => M, shouldUpdate?: (a: M, b: M) => boolean): M
  useConsumer(): T
}
export function createContext<T>(v: T): Context<T> {
  return new ContextFactory(v)
}
let contextUid = 0
class ContextFactory<T> implements Context<T>{
  id = contextUid++
  constructor(
    public readonly out: T
  ) {
    this.defaultContext = valueCenterOf(out)
  }

  private readonly defaultContext: ValueCenter<T>
  hookProvider(v: T) {
    const parentFiber = hookParentFiber()
    const map = parentFiber.contextProvider || new Map()
    parentFiber.contextProvider = map
    let hook = map.get(this) as ValueCenter<T>
    if (!hook) {
      //同作用域会覆盖
      hook = valueCenterOf(v)
      map.set(this, hook)
    }
    hook.set(v)
  }
  private findProvider(_fiber: FiberImpl) {
    let fiber = _fiber as FiberImpl | undefined
    while (fiber) {
      if (fiber.contextProvider) {
        const providers = fiber.contextProvider
        if (providers.has(this)) {
          return providers.get(this) as ValueCenter<T>
        }
      }
      fiber = fiber.parent
    }
    return this.defaultContext
  }
  useConsumer() {
    return this.useSelector(quote)
  }

  /**
   * 可能context没有改变,但本地render已经发生,
   * 每次render都要注册事件,也要销毁前一次注册的事件.必然要在fiber上记忆.
   * @param getValue 
   * @param shouldUpdate 
   * @returns 
   */
  useSelector<M>(getValue: (v: T) => M, shouldUpdate: (a: M, b: M) => any = simpleNotEqual): M {
    const parentFiber = hookParentFiber()
    const context = this.findProvider(parentFiber)
    const thisValue = getValue(context.get())
    useLevelEffect(0, arrayNotEqual, function () {
      return context.subscribe(function (value) {
        const m = getValue(value)
        if (shouldUpdate(thisValue, m)) {
          parentFiber.effectTag = ("UPDATE")
        }
      })
    }, [context, getValue, shouldUpdate])
    return thisValue
  }
}

export function hookEffectTag() {
  const parentFiber = hookParentFiber()
  return parentFiber.effectTag
}


export function hookRequestReconcile() {
  const parentFiber = hookParentFiber()
  if (!parentFiber.requestReconcile) {
    parentFiber.requestReconcile = function (callback) {
      if (parentFiber.destroyed) {
        console.log("更新已经销毁的fiber")
        return
      }
      parentFiber.effectTag = "UPDATE"
      parentFiber.envModel.reUpdate(parentFiber)
    }
  }
  return parentFiber.requestReconcile
}

export function hookMakeDirtyAndRequestUpdate() {
  const parentFiber = hookParentFiber()
  if (!parentFiber.makeDirtyAndRequestUpdate) {
    const requestReconcile = hookRequestReconcile()
    parentFiber.makeDirtyAndRequestUpdate = function () {
      requestReconcile(alawaysTrue)
    }
  }
  return parentFiber.makeDirtyAndRequestUpdate
}