import { renderForEach } from "mve-core"
import { GetValue, ReadArray, RMap } from "wy-helper"


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