
import { hookAddDestroy } from "mve-core";
import { EmptyFun, GetValue, SetValue, trackSignal, trackSignalMemo } from "wy-helper";

export function hookTrackSignal<T>(get: GetValue<T>, set: SetValue<T>): void;
export function hookTrackSignal<T, A>(get: GetValue<T>, set: (v: T, a: A) => void, a: A): void;
export function hookTrackSignal<T, A, B>(get: GetValue<T>, set: (v: T, a: A, b: B) => void, a: A, b: B): void;
export function hookTrackSignal<T, A, B, C>(get: GetValue<T>, set: (v: T, a: A, b: B, c: C) => void, a: A, b: B, c: C): void;
export function hookTrackSignal() {
  hookDestroy(trackSignal.apply(undefined, arguments as any))
}



export const hookTrackSignalMemo: typeof hookTrackSignal = function () {
  hookDestroy(trackSignalMemo.apply(undefined, arguments as any))
}


export function hookDestroy(fun: EmptyFun) {
  hookAddDestroy()(fun)
}