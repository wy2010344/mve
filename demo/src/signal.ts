import { Compare, EmptyFun, GetValue, messageChannelCallback, run, SetValue, simpleNotEqual, StoreRef } from "wy-helper"

const m = globalThis as any
const DepKey = 'wy-helper-signal-cache'
if (!m[DepKey]) {
  m[DepKey] = {
    cacheBatchListener: new Set()
  }
}
const signalCache = m[DepKey] as {
  currentFun?: EmptyFun | undefined,
  batchListeners?: Set<EmptyFun>
  onUpdate?: boolean
  cacheBatchListener: Set<EmptyFun>
  onBatch?: Symbol

  currentRelay?: Set<any>
}
function addListener(listener: EmptyFun) {
  signalCache.batchListeners!.add(listener)
}
/**
 * 信号
 * @param value 
 * @param shouldChange 
 * @returns 
 */
export function Signal<T>(value: T, shouldChange: Compare<T> = simpleNotEqual): StoreRef<T> {
  let listeners = [new Set<EmptyFun>(), new Set<EmptyFun>()]  //可以回收使用吧
  return {
    get() {
      if (signalCache.currentFun) {
        listeners[0].add(signalCache.currentFun)
      }
      return value
    },
    set(newValue) {
      if (signalCache.currentFun) {
        throw '计算期间不允许修改值'
      }
      if (shouldChange(newValue, value)) {
        value = newValue
        const oldListener = listeners.shift()!
        if (!signalCache.batchListeners) {
          batchSignalBegin()
          messageChannelCallback(batchSignalEnd)
        }
        oldListener.forEach(addListener)
        oldListener.clear()
        listeners.push(oldListener)
      }
    },
  }
}

function checkUpdate() {
  if (signalCache.onUpdate) {
    throw "更新期间重复更新"
  }
  signalCache.onUpdate = true
}

export interface SyncFun<T> {
  (set: SetValue<T>): EmptyFun;
  <A>(set: (t: T, a: A) => void, a: A): EmptyFun;
  <A, B>(set: (t: T, a: A, b: B) => void, a: A, b: B): EmptyFun;
  <A, B, C>(set: (t: T, a: A, b: B, c: C) => void, a: A, b: B, c: C): EmptyFun;
}


function batchSignalBegin() {
  if (signalCache.onBatch) {
    throw "批量更新内不能再批量更新"
  }
  signalCache.onBatch = Symbol()
  const listeners = signalCache.cacheBatchListener//可以回收使用吧
  signalCache.batchListeners = listeners

}

export function batchSignalEnd() {
  const listeners = signalCache.batchListeners
  if (listeners) {
    signalCache.batchListeners = undefined
    checkUpdate()
    listeners.forEach(run)
    signalCache.onUpdate = undefined
    listeners.clear()
    signalCache.onBatch = undefined
  } else {
    console.log("未在批量任务中,没必要更新")
  }
}
/**
 * 跟踪信号
 * @param get 通过信号计算出来的值
 * @returns 同步事件
 */
export function trackSignal<T>(get: GetValue<T>, set: SetValue<T>): EmptyFun
export function trackSignal<T, A>(get: GetValue<T>, set: (v: T, a: A) => void, a: A): EmptyFun
export function trackSignal<T, A, B>(get: GetValue<T>, set: (v: T, a: A, b: B) => void, a: A, b: B): EmptyFun
export function trackSignal<T, A, B, C>(get: GetValue<T>, set: (v: T, a: A, b: B, c: C) => void, a: A, b: B, c: C): EmptyFun
export function trackSignal(get: any, set: any): EmptyFun {
  let disabled = false
  const a = arguments[2]
  const b = arguments[3]
  const c = arguments[4]
  function addFun() {
    if (disabled) {
      return
    }
    signalCache.currentFun = addFun
    const value = get()
    signalCache.currentFun = undefined
    set(value, a, b, c)
  }
  addFun()
  //销毁
  return function () {
    disabled = true
  }
}


export function memo<T>(
  fun: GetValue<T>,
  shouldChange: Compare<T> = simpleNotEqual
) {


  const relay = new Set()
  let lastValue!: T
  let batchSymbol!: Symbol
  return function () {
    if (signalCache.onBatch) {
      if (batchSymbol == signalCache.onBatch) {
        return lastValue
      } else {
        //是缓存

      }
    } else {
      return lastValue!
    }
  }
}