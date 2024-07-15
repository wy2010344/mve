import { EnvModel } from "./commitWork"
import { EmptyFun, ValueCenter } from "wy-helper"

export type HookMemo<T, D> = {
  deps: D
  value: T
}
export type HookEffect<D> = {
  shouldChange(a: D, b: D): any
  deps: D
  isInit: boolean
  destroy?: void | ((newDeps: EffectDestroyEvent<D>) => void)
}
export type EffectDestroyEvent<T> = {
  trigger: T
  beforeIsInit: boolean,
  beforeTrigger: T
}
type RenderDeps<D> = {
  isNew: boolean
  deps: D,
  oldDeps?: D,
  render(e: MemoEvent<D>): void
}

type EffectTag = "PLACEMENT" | "UPDATE" | void

export type StoreValueCreater<M extends readonly any[] = readonly any[], T = any,> = {
  (): StoreValue<M, T>
}

export interface StoreValue<M extends readonly any[] = readonly any[], T = any,> {
  hookAddResult(...vs: M): void
  useAfterRender(): T
}

export interface Fiber<M = any> {
  lazyGetResultValue(): M
}
export function isFiber(v: any): v is Fiber<any> {
  return v instanceof FiberImpl
}
/**
 * 会调整顺序的,包括useMap的父节点与子结点.但父节点只调整child与lastChild
 * 子节点只调整prev与next
 * 但是子节点又可能是父节点,父节点也可能是子节点.
 * 如果是普通fiber节点,它的兄弟是定的,但它可能是useMap的根节点
 * 如果是useMap的子节点,它的兄弟是不定的,它的父是定的,
 * 所有的类型,父节点一定是定的,区别在于是父的什么位置
 * 只有声明的时候能确定
 * 普通Fiber的子节点可能是MapFiber,MapFiber自动将child/lastChild变成动态的.
 * 只是MapFiber的子节点都是手动创建的.但手动创建的是普通Fiber,不是MapFiber?
 * 可以是MapFiber,只要控制返回值不是render+deps,而是mapFiber的构造参数
 * 如果是oneFiber,父节点的child与lastChild会变化,但子结点的before与next都是空
 */
export class FiberImpl<D = any, M = any> implements Fiber<M> {
  /**是否已经销毁 */
  destroyed?: boolean
  /**全局key,使帧复用,或keep-alive*/
  // globalKey?: any
  contextProvider?: Map<any, ValueCenter<any>>
  hookEffects?: Map<number, HookEffect<any>[]>
  hookMemo?: {
    shouldChange(a: any, b: any): any
    value: HookMemo<any, any>
  }[]
  /**初始化或更新 
   * UPDATE可能是setState造成的,可能是更新造成的
   * 这其中要回滚
   * 当提交生效的时候,自己的值变空.回滚的时候,也变成空
  */
  effectTag: EffectTag = "PLACEMENT"
  /**顺序*/
  firstChild: FiberImpl | void = undefined!
  lastChild: FiberImpl | void = undefined!
  requestReconcile: ((fun: () => any) => void) | void = undefined
  makeDirtyAndRequestUpdate: EmptyFun | void = undefined
  public before: FiberImpl | void = undefined
  public next: FiberImpl | void = undefined
  constructor(
    public readonly envModel: EnvModel,
    public readonly parent: FiberImpl | undefined,
    public readonly storeValueCreater: StoreValueCreater,
    public readonly shouldChange: (a: D, b: D) => any,
    private renderDeps: RenderDeps<any>
  ) { }
  changeRender(render: (e: MemoEvent<D>) => void, deps: D) {
    const { deps: oldDeps } = this.renderDeps
    if (this.shouldChange(oldDeps, deps)) {
      //能改变render,需要UPDATE
      this.renderDeps = {
        render,
        deps,
        oldDeps,
        isNew: false
      }
      this.effectTag = "UPDATE"
    }
  }
  render(result: StoreValue<any[], M>) {
    this.effectTag = undefined
    const { render, deps, oldDeps, isNew } = this.renderDeps
    render({
      trigger: deps,
      beforeTrigger: oldDeps,
      isInit: isNew
    })
    const out = result.useAfterRender()
    this.resultValue = out
  }
  private resultValue: any = undefined
  lazyGetResultValue() {
    return this.resultValue
  }
}

export type MemoEvent<T> = {
  trigger: T
  isInit: boolean
  beforeTrigger?: T
}
export type RenderWithDep<T> = [
  (a: T, b: T) => any,
  (e: MemoEvent<T>) => void,
  T
]