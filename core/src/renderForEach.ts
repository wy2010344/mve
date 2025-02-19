import { GetValue, RMap, normalMapCreater, memoKeep, memo } from "wy-helper"
import { hookAddResult, hookAlterChildren, hookAlterStateHolder, hookCurrentStateHolder } from "./cache"
import { StateHolder } from "./stateHolder"

export interface RMapCreater<K, V> {
  (): RMap<K, V>
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

type EachValue<T, O> = {
  index: number
  stateHolder: StateHolder
  value: T
  children: any[],
  out: O,
  getOut(): O
}
export function renderForEach<T, O>(
  forEach: (
    callback: (
      value: T,
      creater: (value: T, getIndex: GetValue<number>) => O,
    ) => GetValue<O>) => void,
  createMap: RMapCreater<any, EachValue<T, O>[]> = normalMapCreater
) {
  let cacheMap = createMap()

  let oldMap!: RMap<T, EachValue<T, O>[]>
  let newMap!: RMap<T, EachValue<T, O>[]>
  const thisTimeAdd: {
    x: EachValue<T, O>,
    build: (value: T, getIndex: GetValue<number>) => O
  }[] = []
  const thisChildren: EachValue<T, O>[] = []

  const stateHolder = hookCurrentStateHolder()
  if (!stateHolder) {
    throw '需要在stateHolder里面'
  }
  const contextIndex = stateHolder.contexts.length
  const createSignal = memo(() => {
    oldMap = cloneMap(cacheMap, createMap)
    newMap = createMap()
    thisTimeAdd.length = 0
    thisChildren.length = 0
    let index = 0
    forEach((value, build) => {
      let holders = oldMap.get(value)
      let x: EachValue<T, O>
      if (holders?.length) {
        x = holders.shift()!
      } else {
        x = {
          index,
          value,
          children: [],
          stateHolder: new StateHolder(
            stateHolder,
            contextIndex
          ),
          out: undefined!,
          getOut() {
            return x.out
          },
        }
        thisTimeAdd.push({
          x,
          build
        })
      }
      if (x.value != value) {
        console.warn(`同key下字段发生变化`, x.value, value)
      }
      x.index = index++
      let newEnvs = newMap.get(value)
      if (newEnvs) {
        newEnvs.push(x)
        console.warn(`重复的value`, value, `出现第${newEnvs.length}次`)
      } else {
        newEnvs = [x]
      }
      newMap.set(value, newEnvs)
      thisChildren.push(x)
      return x.getOut
    })
    return newMap
  }, newMap => {
    memoKeep(afterWork)
  })
  function afterWork() {
    //清理、销毁事件
    oldMap.forEach(function (values) {
      values.forEach(value => {
        stateHolder!.removeChild(value.stateHolder)
      })
    })
    //构造新的
    thisTimeAdd.forEach(add => {
      const before = hookAlterStateHolder(add.x.stateHolder)
      const beforeChildren = hookAlterChildren(add.x.children)
      add.x.out = add.build(add.x.value, () => {
        createSignal()
        return add.x.index
      })
      hookAlterChildren(beforeChildren)
      hookAlterStateHolder(before)
    })
    //重新生成
    cacheMap = newMap
  }
  hookAddResult(() => {
    createSignal()
    return thisChildren.flatMap(child => child.children)
  })
  return createSignal
}