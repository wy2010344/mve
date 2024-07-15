import { useMemo } from './useRef'
import { ReducerFun, useReducer } from './useReducer'
import { emptyArray, quote } from "wy-helper"


export type BaseInit<T, F, G> = (
  reducer: ReducerFun<F, T>,
  init: T,
  dispatch: (f: F) => void
) => G
/**
 * 其实没必要了,既然能访问实时值.
 */
export type RefReducerResult<T, G> = [T, G];
export function useRefReducer<G, F, M, T>(
  baseInit: BaseInit<T, F, G>,
  reducer: ReducerFun<F, T>,
  init: M,
  initFun: (m: M) => T,
  eq?: (a: T, b: T) => any): RefReducerResult<F, T>;
export function useRefReducer<G, F, T>(
  baseInit: BaseInit<T, F, G>,
  reducer: ReducerFun<F, T>,
  init: T,
  initFun?: (m: T) => T,
  eq?: (a: T, b: T) => any): RefReducerResult<F, T>;
export function useRefReducer<G, F, T = undefined>(
  baseInit: BaseInit<T, F, G>,
  reducer: ReducerFun<F, T>,
  init?: T,
  initFun?: (m: T) => T,
  eq?: (a: T, b: T) => any): RefReducerResult<F, T>
export function useRefReducer(
  baseInit: BaseInit<any, any, any>,
  reducer: any,
  init: any,
  initFun: any,
  eq: any) {
  const [value, _dispatch] = useReducer(reducer, init, initFun, eq)
  const out = useMemo(function () {
    return baseInit(reducer, (initFun || quote)(init), _dispatch)
  }, emptyArray)
  return [value, out]
}