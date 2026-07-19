import { hookCurrentStateHolder } from 'mve-core';
import {
  EmptyFun,
  MemoGet,
  SetValue,
  trackSignal,
  TrackSignalSet,
} from 'wy-helper';

export function hookTrackSignal<T>(get: MemoGet<T>, set?: TrackSignalSet<T>) {
  hookDestroy(trackSignal(get, set));
}

/**
 * 对未在stateHolder也要支持，全局的。
 * @param fun
 */
export function hookDestroy(fun: EmptyFun) {
  hookCurrentStateHolder()?.addDestroy(fun);
}

export function hookTrackSignalSkipFirst<T>(
  get: MemoGet<T>,
  set: (v: T, oldV: T) => void | EmptyFun
) {
  hookTrackSignal(get, function (a, b, c) {
    if (c) {
      set(a, b!);
    }
  });
}
