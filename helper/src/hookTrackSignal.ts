import { hookAddDestroy } from 'mve-core'
import {
  EmptyFun,
  MemoGet,
  SetValue,
  trackSignal,
  TrackSignalSet,
} from 'wy-helper'

export function hookTrackSignal<T>(get: MemoGet<T>, set?: TrackSignalSet<T>) {
  hookDestroy(trackSignal(get, set))
}

export function hookDestroy(fun: EmptyFun) {
  hookAddDestroy()(fun)
}

export function hookTrackSignalSkipFirst<T>(
  get: MemoGet<T>,
  set: (v: T, oldV: T) => void | EmptyFun
) {
  hookTrackSignal(get, function (a, b, c) {
    if (c) {
      set(a, b!)
    }
  })
}
