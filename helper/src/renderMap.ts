import { Fiber, StoreValueCreater, RenderMapStoreValueCreater, hookAddResult, renderMapF } from "mve-core";
import { alawaysTrue, quote } from "wy-helper";
import { arrayStoreCreater, getArrayStoreCreater } from "./util";

export type ReadArray<T> = {
  length: number
  [index: number]: T
}
export function arrayHasValue(m: ReadArray<any>, i: number) {
  return i < m.length
}

export function createRenderMapF<M, C>(
  storeValueCreater: RenderMapStoreValueCreater,
  hasValue: (v: M, c: C) => any,
  getNext: (v: M, c: C) => C,
  getKey: (v: M, c: C) => any,
  getConfig: (v: M, c: C) => StoreValueCreater
) {
  return function (data: M, initCache: C, render: (v: M, c: C) => void) {
    return renderMapF(data, initCache, hasValue, storeValueCreater, alawaysTrue, function (row, c) {
      return [getNext(row, c), getKey(row, c), getConfig(row, c), alawaysTrue, function () {
        render(row, c)
      }, undefined]
    }, undefined)
  }
}

export function createBaseRenderArray<T>(
  storeValueCreater: RenderMapStoreValueCreater,
  getConfig: (v: T, i: number) => StoreValueCreater
) {
  return function (
    vs: ReadArray<any>,
    getKey: (v: any, i: number) => any,
    render: (v: any, i: number) => void,
    portal?: boolean
  ) {
    const it = renderMapF(vs, 0 as number, arrayHasValue, storeValueCreater, alawaysTrue, function (data, i) {
      const row = data[i]
      return [i + 1, getKey(row, i), getConfig(row, i), alawaysTrue, function () {
        render(row, i)
      }, undefined]
    }, undefined)
    if (portal) {
      return it
    }
    hookAddResult(it)
  }
}

export function createRenderArray<T>(
  storeValueCreater: RenderMapStoreValueCreater,
  getConfig: (v: T, i: number) => StoreValueCreater,
  getKey: (v: T, i: number) => any,
  render: (v: T, i: number) => void
): (vs: ReadArray<T>) => void
export function createRenderArray<T>(
  storeValueCreater: RenderMapStoreValueCreater,
  getConfig: (v: T, i: number) => StoreValueCreater,
  getKey: (v: T, i: number) => any,
): (vs: ReadArray<T>, render: (v: T, i: number) => void) => void
export function createRenderArray(
  storeValueCreater: RenderMapStoreValueCreater,
  getConfig: (v: any, i: number) => StoreValueCreater,
  getKey: (v: any, i: number) => any,
  superRender?: any
) {
  const ra = createBaseRenderArray(storeValueCreater, getConfig)
  return function (vs: ReadArray<any>, render = superRender) {
    return ra(vs, getKey, render)
  }
}

export const renderArray = createBaseRenderArray(arrayStoreCreater, getArrayStoreCreater)


function iterableHasValue<T>(m: IterableIterator<T>, v: IteratorResult<T, any>) {
  return !v.done
}

export function createBaseRenderIterableIterator<V>(
  storeValueCreater: RenderMapStoreValueCreater,
  getConfig: (v: V,) => StoreValueCreater
): BaseRenderIterableIterator<V> {
  return function (
    iterable,
    getKey,
    render,
    portal) {
    const f = renderMapF(iterable, iterable.next(), iterableHasValue, storeValueCreater, alawaysTrue, function (iterable, i) {
      return [iterable.next(), getKey(i.value), getConfig(i.value), alawaysTrue, function () {
        return render(i.value)
      }, undefined]
    }, undefined)
    if (portal) {
      return f
    }
    hookAddResult(f)
    return undefined as any
  }
}

export const baseRenderIterableIterator = createBaseRenderIterableIterator(arrayStoreCreater, getArrayStoreCreater)

export interface BaseRenderIterableIterator<V> {
  (
    iterable: IterableIterator<V>,
    getKey: (value: V) => any,
    render: (value: V) => void,
    portal?: boolean
  ): void | Fiber<any>
}



function getMapEntityKey<K, V>(kv: [K, V]) {
  return kv[0]
}

export function createRenderMap<K, V>(
  it: BaseRenderIterableIterator<[K, V]>
) {
  return function (
    map: Map<K, V>,
    render: (value: V, key: K) => void,
    portal?: boolean
  ) {
    return it(map.entries(), getMapEntityKey, function (row) {
      render(row[1], row[0])
    }, portal)
  }
}

export const renderMap = createRenderMap(baseRenderIterableIterator as any)

export function createRenderSet<V>(
  it: BaseRenderIterableIterator<[V, V]>
) {
  return function (
    set: Set<V>,
    render: (value: V) => void,
    portal?: boolean
  ) {
    it(set.entries(), getMapEntityKey, function (row) {
      render(row[0])
    })
  }
}

export const renderSet = createRenderSet(baseRenderIterableIterator as any)

export type RenderKeyArray<T> = (vs: ReadArray<T>, getKey: (v: T) => any, render: (v: T, i: number) => void) => void
export function createRenderObject<V>(
  renderArray: RenderKeyArray<[string, V]>
) {
  return function (
    object: {
      [key: string]: V
    },
    render: (value: V, key: string) => void
  ) {
    renderArray(Object.entries(object), getMapEntityKey, function (row) {
      render(row[1], row[0])
    })
  }
}

export const renderObject = createRenderObject(renderArray) as <V>(
  object: {
    [key: string]: V
  },
  render: (value: V, key: string) => void
) => void