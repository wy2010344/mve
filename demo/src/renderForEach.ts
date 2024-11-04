import { EmptyFun, GetValue, run, SetValue } from "wy-helper"
import { hookAlterDestroyList, hookTrackSignal } from "./cache"


export interface RMap<K, V> {
  get(key: K): V | undefined
  set(key: K, value: V): void
  forEach(fun: (value: V, key: K) => void): void
}

export interface RMapCreater<K, V> {
  (): RMap<K, V>
}
export function normalMapCreater<K, V>() {
  return new Map<K, V>()
}
export function cloneMap<T>(
  map: RMap<any, T[]>,
  creater: RMapCreater<any, T[]>
) {
  const newMap = creater()
  map.forEach(function (v, k) {
    newMap.set(k, v.slice())
  })
  return newMap
}

type EachValue<T> = {
  destroyList: EmptyFun[]
  value: T
  setValue: SetValue<T>
}
export function renderForEach<T>(
  forEach: (callback: (key: any, creater: SetValue<GetValue<T>>) => SetValue<T>) => void,
  createMap: RMapCreater<any, EachValue<T>[]> = normalMapCreater
) {
  let cacheMap = createMap()

  let oldMap!: RMap<any, EachValue<T>[]>
  let newMap!: RMap<any, EachValue<T>[]>
  let thisTimeAdd: {
    x: EachValue<T>,
    build: SetValue<GetValue<T>>
  }[]
  function createSignal() {
    oldMap = cloneMap(cacheMap, createMap)
    newMap = createMap()
    thisTimeAdd = []

    forEach((key, build) => {
      let holders = oldMap.get(key)
      let x: EachValue<T>
      if (holders?.length) {
        x = holders.shift()!
      } else {
        x = {
          destroyList: [],
          value: undefined!,
          setValue(v) {
            x.value = v
          }
        }
        thisTimeAdd.push({
          x,
          build
        })
      }
      let newEnvs = newMap.get(key)
      if (newEnvs) {
        newEnvs.push(x)
        console.warn(`重复的key[${key}]出现第${newEnvs.length}次`)
      } else {
        newEnvs = [x]
      }
      newMap.set(key, newEnvs)
      return x.setValue
    })
  }
  hookTrackSignal(createSignal, () => {
    //清理、销毁事件
    oldMap.forEach(function (values) {
      values.forEach(value => {
        value.destroyList.forEach(run)
      })
    })
    //构造新的
    thisTimeAdd.forEach(add => {
      const before = hookAlterDestroyList(add.x.destroyList)
      add.build(() => {
        createSignal()
        return add.x.value
      })
      hookAlterDestroyList(before)
    })
    //重新生成
    cacheMap = newMap
  })
}