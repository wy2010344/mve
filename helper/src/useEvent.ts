import { GetValue, emptyArray } from "wy-helper";
import { useCallback } from "./useCallback";
import { useAlways, useLaterSetGet, useMemo } from "./useRef";
import { useAttrEffect } from "./useEffect";

function useBuildGet<T extends (...vs: any[]) => any>(get: GetValue<T>) {
  return useCallback<T>(function (...vs) {
    return get()(...vs)
  } as T, emptyArray)
}
/**
 * 
 * 只是对应单个函数,如果对应多个函数,就是Map,需要直接useRefConst
 * @param fun 
 * @returns 
 */
export function useEvent<T extends (...vs: any[]) => any>(fun: T): T {
  const get = useAlways(fun)
  return useBuildGet(get)
}


export function useAttrEvent<T extends (...vs: any[]) => any>(fun: T): T {
  const value = useLaterSetGet<T>()
  useAttrEffect(() => {
    value.set(fun)
  })
  return useBuildGet(value.get)
}


function useBuildProxy<T extends object>(get: GetValue<T>) {
  return useMemo(() => {
    return new Proxy<T>(get(), {
      get(target, p, receiver) {
        return (get() as any)[p]
      },
      apply(target, thisArg, argArray) {
        return (get() as any).apply(thisArg, argArray)
      },
      construct(target, argArray, newTarget) {
        return new (get() as any)(...argArray)
      },
    })
  }, emptyArray)
}
export function useProxy<T extends object>(init: T) {
  const get = useAlways(init)
  return useBuildProxy(get)
}

export function useAttrProxy<T extends object>(init: T) {
  const value = useLaterSetGet<T>()
  useAttrEffect(() => {
    value.set(init)
  })
  return useBuildProxy(value.get)
}