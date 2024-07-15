import { hookRequestReconcile } from "mve-core";
import { SetValue, emptyArray, quote, simpleEqual, storeRef } from "wy-helper";
import { useMemo } from "./useRef";


export type ReducerFun<F, T> = (old: T, action: F) => T
export type ReducerResult<F, T> = [T, SetValue<F>];

export function useReducer<F, M, T>(
  reducer: ReducerFun<F, T>,
  init: M,
  initFun: (m: M) => T,
  eq?: (a: T, b: T) => any): ReducerResult<F, T>;
export function useReducer<F, T>(
  reducer: ReducerFun<F, T>,
  init: T,
  initFun?: (m: T) => T,
  eq?: (a: T, b: T) => any): ReducerResult<F, T>;
export function useReducer<F, T = undefined>(
  reducer: ReducerFun<F, T>,
  init?: T,
  initFun?: (m: T) => T,
  eq?: (a: T, b: T) => any): ReducerResult<F, T>
export function useReducer(reducer: any, init: any, initFun: any, eq: any) {
  const reconcile = hookRequestReconcile()
  const hook = useMemo(() => {
    /**
     * 这个memo不能像jetpack compose一样依赖key变化,因为是异步生效的
     */
    const realEq = eq || simpleEqual
    const trans = initFun || quote
    const value = storeRef(trans(init))
    function set(action: any) {
      reconcile(function () {
        const oldValue = value.get()
        const newValue = reducer(oldValue, action)
        if (!realEq(oldValue, newValue)) {
          value.set(newValue)
          return true
        }
      })
    }
    return {
      value,
      set,
      reducer,
      init,
      initFun,
      eq
    }
  }, emptyArray)
  if (reducer != hook.reducer) {
    console.warn("reducer上的reducer变化!!")
  }
  return [hook.value.get(), hook.set]
}

export function useReducerFun<F, T>(
  reducer: ReducerFun<F, T>,
  init: () => T,
  eq?: (a: T, b: T) => any) {
  return useReducer(reducer, undefined, init, eq)
}


export function createUseReducer<A, M, I = M>(
  reducer: ReducerFun<A, M>,
  initFun?: (i: I) => M,
  eq?: (a: M, b: M) => any
) {
  return function (init: I) {
    return useReducer(reducer, init, initFun || quote as any, eq)
  }
}

export function createUseReducerFun<A, M>(
  reducer: ReducerFun<A, M>,
  eq?: (a: M, b: M) => any
) {
  return function (initFun: () => M) {
    return useReducer(reducer, undefined, initFun, eq)
  }
}