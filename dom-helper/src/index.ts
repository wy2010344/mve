import { hookDestroy } from 'mve-helper';
import { observerAnimateSignal } from 'wy-dom-helper';
import {
  AnimateFrameSignalConfig,
  createSignal,
  emptyObject,
  getGlobalThis,
  GetValue,
  memo,
  StoreRef,
} from 'wy-helper';
export * from './canvasRender';
export * from './renderInput';
export * from './renderCode';
export * from './useContentEditable';
export * from './renderExitArray';
export * from './centerPicker';
export * from './movePage';
export * from './scroll';
export * from './pop';
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
export * from './hookMeasureSize';
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

type StorageSignalItem = {
  raw: StoreRef<string | null>;
  json: boolean;
  defValue: unknown;
};

/** 同一 storage + key 共享同一个底层 signal，保证同标签页内各组件同步 */
const storageSignalCache = new WeakMap<
  Storage,
  Map<string, StorageSignalItem>
>();
let storageListening = false;

function getStorageItem(
  storage: Storage,
  key: string,
  defValue: unknown,
  json: boolean
): StorageSignalItem {
  let map = storageSignalCache.get(storage);
  if (!map) {
    map = new Map();
    storageSignalCache.set(storage, map);
  }
  let item = map.get(key);
  if (!item) {
    item = {
      raw: createSignal(storage.getItem(key)),
      json,
      defValue,
    };
    map.set(key, item);
  }
  return item;
}

function ensureStorageListener() {
  const win = getGlobalThis().window;
  if (storageListening || !win) {
    return;
  }
  storageListening = true;
  win.addEventListener('storage', e => {
    if (!e.storageArea || !e.key) {
      return;
    }
    const item = storageSignalCache.get(e.storageArea)?.get(e.key);
    if (item) {
      item.raw.set(e.newValue);
    }
  });
}

/**
 * 同一 storage + key 的信号会共享，因此在同一标签页内也会同步。
 * 必须在 StateHolder 内调用。
 */
export function hookStorageSignal<V>(
  key: string,
  defValue: V,
  { storage, json }: StorageSignalArg = emptyObject
): StoreRef<V> {
  const targetStorage = storage ?? getGlobalThis().localStorage;
  if (!targetStorage) {
    // SSR / Node 下没有 localStorage，退化为内存 signal
    const local = createSignal(defValue);
    return {
      get: local.get,
      set: local.set,
    };
  }
  ensureStorageListener();
  const item = getStorageItem(
    targetStorage,
    key,
    defValue,
    json ?? (!!defValue && typeof defValue != 'string')
  );
  const fallback = item.defValue as V;
  return {
    get: (item.json
      ? memo(() => {
          const v = item.raw.get();
          if (v == null) {
            return fallback;
          }
          try {
            return JSON.parse(v);
          } catch {
            console.warn('not a valid storage for ' + key);
            return fallback;
          }
        })
      : () => item.raw.get() ?? fallback) as GetValue<V>,
    set: item.json
      ? (v: V) => {
          const vs = JSON.stringify(v);
          targetStorage.setItem(key, vs);
          item.raw.set(vs);
          return v;
        }
      : (v: V) => {
          targetStorage.setItem(key, v as any);
          item.raw.set(v as any);
          return v;
        },
  };
}

export function globalStorageSignal<V>(
  key: string,
  defValue: V,
  args?: StorageSignalArg
) {
  return hookStorageSignal(key, defValue, args);
}
