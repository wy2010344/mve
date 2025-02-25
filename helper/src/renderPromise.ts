import { createSignal, FalseType, GetValue, PromiseResult, signalSerialAbortPromise } from "wy-helper";
import { hookDestroy } from "./hookTrackSignal";

export function hookPromiseSignal<T>(
  getPromise: GetValue<GetValue<Promise<T>> | FalseType>
) {
  const { destroy, ...args } = signalSerialAbortPromise(getPromise)
  hookDestroy(destroy)
  return args
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