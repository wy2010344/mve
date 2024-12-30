import { createSignal, FalseType, GetValue, hookAbortSignalPromise, PromiseResult } from "wy-helper";
import { hookTrackSignalMemo } from "./hookTrackSignal";

/**
 * promise的过程可能是async的多个promise,所以条件是这个过程,以及依赖的数据要提前准备好
 * 如果在async语句中去条件结果,最后的结果可能是promise<void>不符合预期
 * @param getPromise 
 * @param onFinally 
 */
export function hookPromiseCall<T>(
  getPromise: GetValue<GetValue<Promise<T>> | FalseType>,
  onFinally: (o?: PromiseResult<T>) => void
): void
export function hookPromiseCall<T>(
  getPromise: GetValue<GetValue<Promise<T>>>,
  onFinally: (o: PromiseResult<T>) => void
): void
export function hookPromiseCall(getPromise: any, onFinally: any) {
  let lastControl: AbortController | undefined = undefined
  hookTrackSignalMemo(getPromise, function (gPromise: any) {
    lastControl?.abort()
    if (gPromise) {
      lastControl = new AbortController()
      hookAbortSignalPromise(lastControl.signal, gPromise, onFinally)
    } else {
      lastControl = undefined
      onFinally()
    }
  })
}

export function hookPromiseSignal<T>(
  getPromise: GetValue<GetValue<Promise<T>> | FalseType>
) {
  const signal = createSignal<PromiseResult<T> | undefined>(undefined)
  hookPromiseCall(getPromise, signal.set)
  return signal
}



export function promiseSignal<T>(promise: Promise<T>) {
  const signal = createSignal<PromiseResult<T> | undefined>(undefined)
  promise.then(value => signal.set({
    type: "success",
    value
  })).catch(err => {
    signal.set({
      type: "error",
      value: err
    })
  })
  return signal
}