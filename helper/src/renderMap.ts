import { renderForEach } from "mve-core"
import { GetValue, normalMapCreater, quote, ReadArray, RMap, run } from "wy-helper"



export function renderArray<T>(
  getVs: GetValue<ReadArray<T>>,
  render: (value: T, getIndex: GetValue<number>) => void,
  createMap?: <V>() => RMap<any, V>
) {
  renderForEach<T, void>(
    function (callback) {
      const vs = getVs()
      for (let i = 0; i < vs.length; i++) {
        const v = vs[i]
        callback(v, render)
      }
    }, createMap)
}
export function renderArrayToMap<T, O, K = T>(
  getVs: GetValue<ReadArray<T>>,
  render: (get: T, getIndex: GetValue<number>) => O,
  getKey: ((v: T, i: number) => K) = quote as any,
  createMap: <V>() => RMap<any, V> = normalMapCreater
): GetValue<RMap<K, GetValue<O>>> {
  let gets: RMap<K, GetValue<O>>
  const getSignal = renderForEach<T, O>(
    function (callback) {
      const vs = getVs()
      gets = createMap<GetValue<O>>()
      for (let i = 0; i < vs.length; i++) {
        const v = vs[i]
        const key = getKey(v, i)
        const get = callback(v, render)
        gets.set(key, get)
      }
    }, createMap)
  return function () {
    getSignal()
    return gets
  }
}
export function renderArrayToArray<T, O>(
  getVs: GetValue<ReadArray<T>>,
  render: (get: T, getIndex: GetValue<number>) => O,
  createMap?: <V>() => RMap<any, V>
): GetValue<O[]> {
  let gets: GetValue<O>[]
  const getSignal = renderForEach<T, O>(
    function (callback) {
      const vs = getVs()
      gets = []
      for (let i = 0; i < vs.length; i++) {
        const v = vs[i]
        const get = callback(v, render)
        gets.push(get)
      }
    }, createMap)
  return function () {
    getSignal()
    return gets.flatMap(run)
  }
}