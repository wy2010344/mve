import { AutoLoadMoreCore, Compare, createSignal, FalseType, GetValue, PromiseResult, signalSerialAbortPromise, signalSerialAbortPromiseLoadMore } from "wy-helper";
import { hookDestroy } from "./hookTrackSignal";

export function hookPromiseSignal<T>(
  getPromise: GetValue<GetValue<Promise<T>> | FalseType>
) {
  const { destroy, ...args } = signalSerialAbortPromise(getPromise)
  hookDestroy(destroy)
  return args
}

export function hookPromiseSignalLoadMore<T, K, M = {}>(getPromise: GetValue<{
  getAfter(k: K): Promise<AutoLoadMoreCore<T, K> & M>;
  first: K;
} | FalseType>, equals?: Compare<T>) {
  const { destroy, ...args } = signalSerialAbortPromiseLoadMore(getPromise, equals)
  hookDestroy(destroy)
  return args
}


export function promiseSignal<T>(promise: Promise<T>) {
  const signal = createSignal<PromiseResult<T> | undefined>(undefined)
  promise.then(value => signal.set({
    type: "success",
    promise,
    value
  })).catch(err => {
    signal.set({
      type: "error",
      promise,
      value: err
    })
  })
  return signal
}