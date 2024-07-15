import { ReadValueCenter, quote } from "wy-helper";
import { EmptyFun } from "wy-helper";
import { useEffect } from "./useEffect";
import { useChangeFun } from "./useState";

/**
 * 
 * @param subscribe 最好保证订阅函数的独立
 * @param getSnapshot 
 * @returns 
 */
export function useSyncExternalStore<T>(subscribe: (callback: EmptyFun) => EmptyFun, getSnapshot: () => T) {
  return useStoreTriggerRender({
    get: getSnapshot,
    subscribe
  })
}
/**
 *
 * @param store
 * @param arg 只能初始化,中间不可以改变,即使改变,也是跟随的
 */
export function useStoreTriggerRender<T, M>(store: ReadValueCenter<T>, filter: (a: T) => M): M;
export function useStoreTriggerRender<T>(store: ReadValueCenter<T>, filter?: (a: T) => T): T;
export function useStoreTriggerRender<T>(store: ReadValueCenter<T>) {
  const filter = arguments[1] || quote
  const [state, setState] = useChangeFun(() => filter(store.get()))
  useEffect(() => {
    const v = filter(store.get())
    if (state != v) {
      setState(v)
    }
    return store.subscribe(function (d) {
      setState(filter(d))
    })
  }, [store, store.subscribe, filter])
  return state
}