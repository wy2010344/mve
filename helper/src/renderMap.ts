import { renderForEach } from "mve-core"
import { Compare, GetValue, memo, normalMapCreater, quote, ReadArray, RMap, run, simpleEqual } from "wy-helper"



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


/**
 * 对数组里面的列表进行缓存
 * @param getVs 
 * @param equal 
 * @returns 
 */
export function memoArray<T>(getVs: GetValue<ReadArray<T>>, equal: Compare<T> = simpleEqual) {
  return memo<ReadArray<T>>(function (olds) {
    if (olds) {
      return Array.prototype.map.call(getVs(), function (value) {
        const oldIndex = Array.prototype.findIndex.call(olds, function (old) {
          return equal(old, value)
        })
        if (oldIndex < 0) {
          return value
        }
        return olds[oldIndex]
      }) as T[]
    } else {
      return getVs()
    }
  })
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