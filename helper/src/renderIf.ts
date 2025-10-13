import { emptyFun, EmptyFun, GetValue } from 'wy-helper';
import { renderArray, renderArrayKey } from './renderMap';

export function renderIfP(
  get: any,
  whenTrue: EmptyFun,
  whenFalse: EmptyFun = emptyFun
) {
  if (typeof get == 'function') {
    renderIf(get, whenTrue, whenFalse);
  } else {
    if (get) {
      whenTrue(get);
    } else {
      whenFalse(get);
    }
  }
}

export function renderIf(
  get: GetValue<any>,
  whenTrue: EmptyFun,
  whenFalse: EmptyFun = emptyFun
) {
  renderArray(
    () => {
      return [Boolean(get())];
    },
    d => {
      if (d) {
        whenTrue(get);
      } else {
        whenFalse(get);
      }
    }
  );
}

export function renderOneP<K>(get: GetValue<K> | K, render: (v: K) => void) {
  if (typeof get == 'function') {
    renderOne(get as any, render);
  } else {
    render(get);
  }
}
export function renderOne<K>(get: GetValue<K>, render: (v: K) => void) {
  renderArray(() => [get()], render);
}

export function renderOneKey<T, K>(
  get: GetValue<T>,
  getKey: (v: T) => K,
  render: (key: K, get: GetValue<T>) => void
) {
  renderArrayKey(
    () => [get()],
    getKey,
    (_, _1, key) => render(key, get)
  );
}

type ToTupleByKey<T, K extends keyof T> =
  T extends Record<K, infer Key> ? [Key, GetValue<T>] : never;
export function renderOrKey<T, K extends keyof T>(
  get: GetValue<T | void | null | undefined>,
  key: K,
  render: (...vs: ToTupleByKey<T, K> | [undefined, GetValue<never>]) => void
) {
  renderOneKey(get, v => v?.[key], render as any);
}
