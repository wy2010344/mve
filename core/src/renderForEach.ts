import { GetValue, RMap, normalMapCreater, memoKeep, memo, MemoFun, emptyObject } from "wy-helper"
import { hookAddResult, hookAlterChildren, hookAlterStateHolder, hookCurrentStateHolder } from "./cache"
import { StateHolder } from "./stateHolder"

export function cloneMap<K, T>(
  map: RMap<K, T[]>,
  creater: <K, V>() => RMap<K, V>
) {
  const newMap = creater<K, T[]>()
  map.forEach(function (v, k) {
    newMap.set(k, v.slice())
  })
  return newMap
}

export interface EachTime<T> {
  getIndex(): number
  getValue(): T
}
class EachTimeI<T, K, O> implements EachTime<T> {
  constructor(private it: EachValue<T, K, O>) {
    if (it.arg.bindIndex) {
      this.getIndex = this.getIndex.bind(this)
    }
    if (it.arg.bindValue) {
      this.getValue = this.getValue.bind(this)
    }
  }
  getIndex() {
    this.it.createSignal()
    return this.it.index
  }
  getValue() {
    this.it.createSignal()
    return this.it.value
  }
}

class EachValue<T, K, O> {
  constructor(
    readonly key: K,
    readonly arg: RenderForEachArg,
    readonly creater: Creater<T, K, O>,
    readonly createSignal: MemoFun<RMap<K, EachValue<T, K, O>[]>>,
    private stateHolder: StateHolder,
  ) {
    if (arg.bindOut) {
      this.getOut = this.getOut.bind(this)
    }
    this.eachTime = new EachTimeI(this)
  }
  private eachTime: EachTime<T>
  private out!: O
  public value!: T
  public index!: number
  readonly children: any[] = []
  getOut() {
    return this.out
  }
  create() {
    const before = hookAlterStateHolder(this.stateHolder)
    const beforeChildren = hookAlterChildren(this.children)
    this.out = this.creater(this.key, this.eachTime)
    hookAlterChildren(beforeChildren)
    hookAlterStateHolder(before)
  }

  remove() {
    this.stateHolder.removeFromParent()
  }
}

type Creater<T, K, O> = (key: K, eachTime: EachTime<T>) => O
export type RenderForEachArg = {
  bindIndex?: any
  bindValue?: any
  bindOut?: any
  createMap?: <K, V>() => RMap<K, V>
}
export function renderForEach<T, K = T, O = void>(
  forEach: (
    callback: (
      key: K,
      value: T
    ) => GetValue<O>
  ) => void,
  creater: Creater<T, K, O>,
  arg: RenderForEachArg = emptyObject
) {
  const createMap: <K, V>() => RMap<K, V> = arg.createMap || normalMapCreater
  let cacheMap = createMap<K, EachValue<T, K, O>[]>()
  let oldMap!: RMap<K, EachValue<T, K, O>[]>
  let newMap!: RMap<K, EachValue<T, K, O>[]>
  const thisTimeAdd: EachValue<T, K, O>[] = []
  const thisChildren: EachValue<T, K, O>[] = []
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
    forEach((key, value) => {
      let holders = oldMap.get(key)
      let x: EachValue<T, K, O>
      if (holders?.length) {
        x = holders.shift()!
      } else {
        x = new EachValue(
          key,
          arg,
          creater,
          createSignal,
          new StateHolder(
            stateHolder,
            contextIndex
          ))
        thisTimeAdd.push(x)
      }
      x.index = index++
      x.value = value
      let newEnvs = newMap.get(key)
      if (newEnvs) {
        newEnvs.push(x)
        console.warn(`重复的key`, key, `出现第${newEnvs.length}次`)
      } else {
        newEnvs = [x]
      }
      newMap.set(key, newEnvs)
      thisChildren.push(x)
      return x.getOut
    })
    return newMap
  }, newMap => {
    memoKeep(afterWork)
  })
  function afterWork() {
    //清理、销毁事件
    oldMap.forEach(oldRemoveStateHolders)
    //构造新的
    thisTimeAdd.forEach(thisTimeAddEach)
    //重新生成
    cacheMap = newMap
  }
  hookAddResult(() => {
    createSignal()
    return thisChildren.flatMap(getChildren)
  })
  return createSignal
}


function thisTimeAddEach<T, K, O>(add: EachValue<T, K, O>) {
  add.create()
}

function oldRemoveStateHolders<T, K, O>(children: EachValue<T, K, O>[]) {
  children.forEach(removeStateHolder)
}

function removeStateHolder<T, K, O>(child: EachValue<T, K, O>) {
  child.remove()
}
function getChildren<T, K, O>(child: EachValue<T, K, O>) {
  return child.children
}