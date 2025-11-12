import { hookDestroy, hookTrackSignalSkipFirst } from 'mve-helper';
import { observerAnimateSignal, subscribeEventListener } from 'wy-dom-helper';
import {
  AnimateFrameSignalConfig,
  createSignal,
  GetValue,
  memo,
} from 'wy-helper';
export * from './canvasRender';
export * from './absoluteRender';
export * from './renderInput';
export * from './renderCode';
export * from './useContentEditable';
export * from './renderExitArray';
export * from './centerPicker';
export * from './movePage';
export * from './scroll';
export * from './pop';
export * from './three';
export * from './cns';
export * from './fakeRoute';
export * from './tsxSupport';
export * from './moveEdgeScroll';
export * from './hookTransition';
export * from './hookLockScroll';
export * from './hookTouch';
export * from './pluginTouchHover';
export * from './renderNode';
export * from './button';
export function hookAnimateSignal(
  get: GetValue<number>,
  config?: AnimateFrameSignalConfig
) {
  const [ret, destroy] = observerAnimateSignal(get, config);
  hookDestroy(destroy);
  return ret;
}

export function hookStorageSignal<V>(
  key: string,
  defValue: V,
  storage: Storage = localStorage,
  json = defValue && typeof defValue != 'string'
) {
  const value = createSignal(localStorage.getItem(key));
  hookDestroy(
    subscribeEventListener(window, 'storage', e => {
      if (e.storageArea == storage && e.key == key) {
        value.set(e.newValue);
      }
    })
  );
  return {
    get: json
      ? memo(() => {
          const v = value.get();
          if (v == null) {
            return defValue;
          }
          try {
            return JSON.parse(v);
          } catch {
            console.warn('not a valid storage for ' + key);
            return defValue;
          }
        })
      : () => value.get() ?? defValue,
    set: json
      ? (v: V) => {
          localStorage.setItem(key, JSON.stringify(v));
        }
      : (v: V) => {
          localStorage.setItem(key, v as any);
        },
  };
}
