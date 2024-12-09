import { createAbortController, createSignal, emptyFun, FalseType, GetValue, hookSetAbortSignal, PromiseResult } from "wy-helper";
import { hookTrackSignalMemo } from "./hookTrackSignal";

export function hookPromiseCall<T>(
  getPromise: GetValue<Promise<T> | FalseType>,
  onFinally: (o?: PromiseResult<T>) => void
): void
export function hookPromiseCall<T>(
  getPromise: GetValue<Promise<T>>,
  onFinally: (o: PromiseResult<T>) => void
): void
export function hookPromiseCall(getPromise: any, onFinally: any) {
  let lastPromise: any
  let lastCancel = emptyFun
  hookTrackSignalMemo(() => {
    lastCancel()
    const control = createAbortController()
    hookSetAbortSignal(control.signal)
    lastCancel = control.cancel
    return getPromise()
  }, function (promise) {
    hookSetAbortSignal()
    lastPromise = promise
    if (promise instanceof Promise) {
      promise.then(value => {
        if (promise == lastPromise) {
          onFinally({
            type: "success",
            value
          })
        }
      }).catch(err => {
        if (promise == lastPromise) {
          onFinally({
            type: "error",
            value: err
          })
        }
      })
    } else {
      onFinally()
    }
  })
}

export function hookPromiseSignal<T>(
  getPromise: GetValue<Promise<T> | undefined>
) {
  const signal = createSignal<PromiseResult<T> | undefined>(undefined)
  hookPromiseCall(getPromise, signal.set)
  return signal
}