import { alawaysFalse, ArrayHelper, createSignal, defaultToGetTrue, emptyArray, EmptyFun, emptyObject, ExitAnimateMode, ExitAnimateWait, getOutResolvePromise, GetValue, memo, NoInsertArrayHelper, objectFreezeThrow, SetValue, ValueOrGet, valueOrGetToGet } from "wy-helper";


export function getExitAnimateArray<T>(
  get: GetValue<T[]>,
  arg: {
    exitIgnore?: any | ((v: T) => any)
    enterIgnore?: any | ((v: T) => any)
    mode?: ValueOrGet<ExitAnimateMode | undefined>
    wait?: ValueOrGet<ExitAnimateWait | undefined>

    onExitComplete?(v?: any): void
    onEnterComplete?(v?: any): void
    onAnimateComplete?(v?: any): void
  } = emptyObject
) {
  const wait = valueOrGetToGet(arg.wait)
  const mode = valueOrGetToGet(arg.mode)
  const exitIgnore = defaultToGetTrue(arg.exitIgnore) || alawaysFalse
  const enterIgnore = defaultToGetTrue(arg.enterIgnore) || alawaysFalse

  const version = createSignal(0)
  function updateVersion() {
    version.set(version.get() + 1)
  }
  let oldList: readonly ExitModelInner<T>[] = emptyArray as any[]

  const thisAddList: ExitModelInner<T>[] = []
  const thisRemoveList: ExitModelInner<T>[] = []
  function buildRemove(old: ExitModelInner<T>) {
    const [promise, resolve] = getOutResolvePromise()
    old.promise = promise
    old.resolve = resolve
    old.step = "exiting"
    promise.then(function () {
      const cacheList = new ArrayHelper(oldList)
      cacheList.removeWhere(v => v == old)
      if (cacheList.isDirty()) {
        oldList = cacheList.get()
        updateVersion()
      }
    })
  }
  const getList = memo<readonly ExitModel<T>[]>((lastReturn) => {
    version.get()
    const list = get()
    const newCacheList = new ArrayHelper(oldList)
    thisAddList.length = 0
    thisRemoveList.length = 0
    newCacheList.forEachRight(function (old, i) {
      if (!isExitingItem(old) && !list.some(v => v == old.value)) {
        //old不是将删除元素,且新列表里已经找不到old
        if (exitIgnore(old.value)) {
          newCacheList.removeAt(i)
        } else {
          old.step = "will-exiting"
          thisRemoveList.push(old)
        }
      }
    })

    const addStep = wait() == 'out-in' && thisRemoveList.length ? 'will-enter' : 'enter'
    let nextIndex = 0
    for (let i = 0, len = list.length; i < len; i++) {
      const v = list[i]
      const oldIndex = newCacheList.get().findIndex(old => !isExitingItem(old) && old.value == v)
      if (oldIndex < 0) {
        if (mode() == 'shift') {
          let item: ExitModelInner<T>
          while ((item = newCacheList.get()[nextIndex]) && isExitingItem(item)) {
            nextIndex++
          }
        }
        const cache: ExitModelInner<T> = {
          value: v,
          target: {
            value: v,
            step() {
              //不像renderForEach在内部访问,所以没有循环访问
              getList()
              return cache.step as any
            },
            resolve(v) {
              cache.resolve?.(v)
            },
            promise() {
              return cache.promise
            }
          },
          enterIgnore: enterIgnore(v),
          step: addStep
        }
        objectFreezeThrow(cache.target)
        if (!cache.enterIgnore) {
          const [promise, resolve] = getOutResolvePromise()
          cache.promise = promise
          cache.resolve = resolve
          thisAddList.push(cache)
        }
        newCacheList.insert(nextIndex, cache)
      } else {
        nextIndex = oldIndex + 1
      }
    }

    if (!(thisAddList.length && wait() == 'in-out')) {
      thisRemoveList.forEach(buildRemove)
    }

    const removePromiseList = thisRemoveList.map(v => v.promise)
    if (removePromiseList.length) {
      const allDestroyPromise = Promise.all(removePromiseList)
      if (arg.onExitComplete) {
        allDestroyPromise.then(arg.onExitComplete)
      }
      const onExitWait = wait() == 'out-in' && thisAddList.length != 0
      if (onExitWait) {
        allDestroyPromise.then(function () {
          const cacheList = new ArrayHelper(oldList)
          let i = 0
          cacheList.forEach(cache => {
            if (cache.step == 'will-enter') {
              const row = thisAddList.find(v => v == cache)
              if (row) {
                i++
                row.step = 'enter'
              }
            }
          })
          if (i) {
            oldList = cacheList.get()
            updateVersion()
          }
        })
      }
    }
    const addPromiseList = thisAddList.map(v => v.promise)
    if (addPromiseList.length) {
      const allAddPromise = Promise.all(addPromiseList)
      if (arg.onEnterComplete) {
        allAddPromise.then(arg.onEnterComplete)
      }
      const onEnterWait = wait() == 'in-out' && thisRemoveList.length != 0
      if (onEnterWait) {
        allAddPromise.then(function () {
          thisRemoveList.forEach(buildRemove)
          updateVersion()
        })
      }
    }
    if (arg.onAnimateComplete && (removePromiseList.length || removePromiseList.length)) {
      Promise.all([
        ...addPromiseList,
        ...removePromiseList
      ]).then(arg.onAnimateComplete)
    }

    oldList = newCacheList.get()
    const tempCacheList = new ArrayHelper(oldList)
    tempCacheList.forEachRight(hideAsShowAndRemoteHide)
    const newCacheGenerateList = tempCacheList.get()
    return newCacheGenerateList.map(getExitModel)
  })
  return getList
}

export type ExitModel<V> = {
  readonly value: V
  //因为will-exiting时原节点就删除了,需要在此时clone节点
  readonly step: GetValue<"exiting" | "will-exiting" | "enter">
  readonly resolve: EmptyFun
  readonly promise: GetValue<Promise<void> | undefined>
}

function getExitModel<V>(v: ExitModelInner<V>) {
  return v.target
}

interface ExitModelInner<V> {
  value: V
  target: ExitModel<V>
  readonly enterIgnore?: false
  /** */
  promise?: Promise<any>
  resolve?(v?: any): void
  step: "exiting" | "will-exiting" | "will-enter" | "enter"
}

function isExitingItem(v: ExitModelInner<any>) {
  return v.step == 'exiting' || v.step == 'will-exiting'
}

function hideAsShowAndRemoteHide<T>(v: ExitModelInner<T>, i: number, array: ArrayHelper<ExitModelInner<T>>) {
  if (v.step == 'will-enter') {
    array.removeAt(i)
  }
}
