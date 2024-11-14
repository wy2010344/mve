import { renderForEach } from "mve-core"
import { GetValue, normalMapCreater, ReadArray, RMap, run } from "wy-helper"


export type ItemWithIndex<T> = {
  item: T
  index: number
}
export function renderArray<T, K>(
  getVs: GetValue<ReadArray<T>>,
  getKey: (v: T, i: number) => K,
  render: (get: GetValue<Readonly<ItemWithIndex<T>>>) => void,
  createMap?: <V>() => RMap<K, V>
) {
  renderForEach<Readonly<ItemWithIndex<T>>, K, void>(
    function (callback) {
      const vs = getVs()
      for (let i = 0; i < vs.length; i++) {
        const v = vs[i]
        const key = getKey(v, i)
        callback(key, render, {
          index: i,
          item: v
        })
      }
    }, createMap)
}
export function renderArrayToMap<T, K, O>(
  getVs: GetValue<ReadArray<T>>,
  getKey: (v: T, i: number) => K,
  render: (get: GetValue<Readonly<ItemWithIndex<T>>>) => O,
  createMap: <V>() => RMap<K, V> = normalMapCreater
): GetValue<RMap<K, GetValue<O>>> {
  let gets: RMap<K, GetValue<O>>
  const getSignal = renderForEach<Readonly<ItemWithIndex<T>>, K, O>(
    function (callback) {
      const vs = getVs()
      gets = createMap<GetValue<O>>()
      for (let i = 0; i < vs.length; i++) {
        const v = vs[i]
        const key = getKey(v, i)
        const get = callback(key, render, {
          index: i,
          item: v
        })
        gets.set(key, get)
      }
    }, createMap)
  return function () {
    getSignal()
    return gets
  }
}
export function renderArrayToArray<T, K, O>(
  getVs: GetValue<ReadArray<T>>,
  getKey: (v: T, i: number) => K,
  render: (get: GetValue<Readonly<ItemWithIndex<T>>>) => O,
  createMap?: <V>() => RMap<K, V>
): GetValue<O[]> {
  let gets: GetValue<O>[]
  const getSignal = renderForEach<Readonly<ItemWithIndex<T>>, K, O>(
    function (callback) {
      const vs = getVs()
      gets = []
      for (let i = 0; i < vs.length; i++) {
        const v = vs[i]
        const key = getKey(v, i)
        const get = callback(key, render, {
          index: i,
          item: v
        })
        gets.push(get)
      }
    }, createMap)
  return function () {
    getSignal()
    return gets.flatMap(run)
  }
}