import { runGlobalHolder } from 'mve-core';
import { hookDestroy, hookTrackSignalSkipFirst } from 'mve-helper';
import { observerAnimateSignal, subscribeEventListener } from 'wy-dom-helper';
import {
  AnimateFrameSignalConfig,
  createSignal,
  emptyObject,
  GetValue,
  memo,
  StoreRef,
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
export * from './layoutIndex';
export * from './pointerDrag';
export function hookAnimateSignal(
  get: GetValue<number>,
  config?: AnimateFrameSignalConfig
) {
  const [ret, destroy] = observerAnimateSignal(get, config);
  hookDestroy(destroy);
  return ret;
}

export type StorageSignalArg = {
  storage?: Storage;
  json?: boolean;
};
/**
 * 这个必须在内部
 * @param key
 * @param defValue
 * @param storage
 * @param json
 * @returns
 */
export function hookStorageSignal<V>(
  key: string,
  defValue: V,
  {
    storage = localStorage,
    json = defValue && typeof defValue != 'string',
  }: StorageSignalArg = emptyObject
): StoreRef<V> {
  const value = createSignal(storage.getItem(key));
  hookDestroy(
    subscribeEventListener(window, 'storage', e => {
      if (e.storageArea == storage && e.key == key) {
        value.set(e.newValue);
      }
    })
  );
  return {
    get: (json
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
      : () => value.get() ?? defValue) as GetValue<V>,
    set: json
      ? (v: V) => {
          //因为
          const vs = JSON.stringify(v);
          storage.setItem(key, vs);
          value.set(vs);
          return v;
        }
      : (v: V) => {
          storage.setItem(key, v as any);
          value.set(v as any);
          return v;
        },
  };
}

export function globalStorageSignal<V>(
  key: string,
  defValue: V,
  args?: StorageSignalArg
) {
  return runGlobalHolder(() => hookStorageSignal(key, defValue, args));
}
