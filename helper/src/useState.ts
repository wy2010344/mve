
import { ReducerFun, ReducerResult, useReducer } from "./useReducer";
import { useRefReducer } from "./useRefReducer";
import { GetValue, RWValue, SetValue, initRWValue, quote, run } from "wy-helper";



export type StateReducerState<T> = T | ((v: T) => T)
function reducer<T>(old: T, action: StateReducerState<T>) {
  if (typeof (action) == 'function') {
    return (action as any)(old)
  } else {
    return action
  }
}

/**
 * useState的特殊性,不能存储函数
 */
export function useState<T = undefined>(): ReducerResult<StateReducerState<T | undefined>, T | undefined>
export function useState<M, T>(init: M, trans: (v: M) => T): ReducerResult<StateReducerState<T>, T>
export function useState<T>(init: T | (() => T)): ReducerResult<StateReducerState<T>, T>
export function useState() {
  const [init, trans] = arguments
  if (typeof (init) == 'function') {
    return useReducer<any, any, any>(reducer, init, run)
  } else {
    return useReducer<any, any, any>(reducer, init, trans)
  }
}
export function useStateEq<T = undefined>(
  eq: (a: T | undefined, b: T | undefined) => any
): ReducerResult<StateReducerState<T | undefined>, T | undefined>
export function useStateEq<M, T>(
  eq: (a: T, b: T) => any,
  init: M, trans: (v: M) => T): ReducerResult<StateReducerState<T>, T>
export function useStateEq<T>(
  eq: (a: T, b: T) => any,
  init: T | (() => T)): ReducerResult<StateReducerState<T>, T>
export function useStateEq() {
  const [eq, init, trans] = arguments
  if (typeof (init) == 'function') {
    return useReducer<any, any, any>(reducer, init, run, eq)
  } else {
    return useReducer<any, any, any>(reducer, init, trans, eq)
  }
}











function change<T>(old: T, action: T) {
  return action
}
export function useChange<T = undefined>(): ReducerResult<T | undefined, T | undefined>
export function useChange<M, T>(
  v: M,
  init: (v: M) => T): ReducerResult<T, T>
export function useChange<T>(
  v: T
): ReducerResult<T, T>
export function useChange<T>(): ReducerResult<T, T> {
  const [init, trans] = arguments
  return useReducer(change, init, trans)
}




export function useChangeEq<T = undefined>(
  eq: (a: T | undefined, b: T | undefined) => any
): ReducerResult<T | undefined, T | undefined>
export function useChangeEq<M, T>(
  eq: (a: T, b: T) => any,
  v: M,
  init: (v: M) => T): ReducerResult<T, T>
export function useChangeEq<T>(
  eq: (a: T, b: T) => any,
  v: T
): ReducerResult<T, T>
export function useChangeEq<T>(): ReducerResult<T, T> {
  const [eq, init, trans] = arguments
  return useReducer(change, init, trans, eq)
}





export function useChangeFun<T>(fun: () => T): ReducerResult<T, T> {
  return useChange(undefined, fun)
}
export function useChangeEqFun<T>(
  eq: (a: T, b: T) => any,
  fun: () => T): ReducerResult<T, T> {
  return useChangeEq(eq, undefined, fun)
}






export function createUseRefValue<T, O, M = T>(
  create: (get: GetValue<T>, set: SetValue<T>) => O,
  {
    eq,
    init
  }: {
    eq?: (a: T, b: T) => any
    init?: (a: M) => T
  }
) {
  function initRef(
    reducer: ReducerFun<T, T>,
    value: T,
    dispatch: (f: T) => void) {
    function setValue(v: T) {
      dispatch(v)
      value = reducer(value, v)
    }
    return create(() => value, setValue)
  }
  const initF = (init || quote) as (a: M) => T
  return function (initArg: M) {
    return useRefReducer(initRef, change, initArg, initF, eq)
  }
}


type RefValueOut<T> = [T, RWValue<T>]
export function useRefValue<T = undefined>(): RefValueOut<T | undefined>
export function useRefValue<M, T>(v: M, init: (v: M) => T): RefValueOut<T>
export function useRefValue<T>(v: T): RefValueOut<T>
export function useRefValue() {
  return useRefReducer(initRef, change, arguments[0], arguments[1])
}
export function useRefValueFun<T>(fun: () => T): RefValueOut<T> {
  return useRefValue(undefined, fun)
}

function initRef<T>(reducer: ReducerFun<T, T>, value: T, dispatch: (f: T) => void) {
  function setValue(v: T) {
    dispatch(v)
    value = reducer(value, v)
  }
  return initRWValue(() => value, setValue)
}

export function useRefValueEq<T = undefined>(
  eq: (a: T | undefined, b: T | undefined) => any
): RefValueOut<T | undefined>
export function useRefValueEq<M, T>(eq: (a: T, b: T) => any, v: M, init: (v: M) => T): RefValueOut<T>
export function useRefValueEq<T>(eq: (a: T, b: T) => any, v: T): RefValueOut<T>
export function useRefValueEq() {
  return useRefReducer(initRef, change, arguments[1], arguments[2], arguments[0])
}
export function useRefValueEqFun<T>(eq: (a: T, b: T) => any, fun: () => T): RefValueOut<T> {
  return useRefValueEq(eq, undefined, fun)
}
