
import { hookAddDestroy } from "mve-core";
import { EmptyFun, MemoGet, SetValue, trackSignal } from "wy-helper";

export function hookTrackSignal<T>(get: MemoGet<T>, set?: SetValue<T>): void;
export function hookTrackSignal<T, A>(get: MemoGet<T>, set: (v: T, a: A) => void, a: A): void;
export function hookTrackSignal<T, A, B>(get: MemoGet<T>, set: (v: T, a: A, b: B) => void, a: A, b: B): void;
export function hookTrackSignal<T, A, B, C>(get: MemoGet<T>, set: (v: T, a: A, b: B, c: C) => void, a: A, b: B, c: C): void;
export function hookTrackSignal() {
  hookDestroy(trackSignal.apply(undefined, arguments as any))
}

export function hookDestroy(fun: EmptyFun) {
  hookAddDestroy()(fun)
}

export const hookTrackSignalSkipFirst: typeof hookTrackSignal = function (...vs: any[]) {
  const set = vs[1]
  let first = true
  vs[1] = function () {
    if (first) {
      first = false
      return
    }
    set.apply(undefined, arguments)
  }
  hookTrackSignal.apply(undefined, vs as any)
}