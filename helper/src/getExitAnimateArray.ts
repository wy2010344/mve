import { alawaysFalse, ArrayHelper, createSignal, defaultToGetTrue, emptyArray, emptyObject, ExitAnimateMode, ExitAnimateWait, getOutResolvePromise, GetValue, memo, NoInsertArrayHelper, objectFreezeThrow, SetValue, ValueOrGet, valueOrGetToGet } from "wy-helper";


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
  let lastGenerateList: readonly ExitModelInner<T>[] = emptyArray as any[]
  const getList = memo<readonly ExitModel<T>[]>((lastReturn) => {
    version.get()
    const list = get()
    const newCacheList = new ArrayHelper(oldList)
    thisAddList.length = 0
    thisRemoveList.length = 0
    newCacheList.forEachRight(function (old, i) {
      if (!old.exiting && !list.some(v => v == old.value)) {
        if (exitIgnore(old.value)) {
          newCacheList.removeAt(i)
        } else {
          const [promise, resolve] = getOutResolvePromise()
          old.promise = (promise)
          old.resolve = (resolve)
          old.exiting = true
          thisRemoveList.push(old)
          promise.then(function () {
            const cacheList = new ArrayHelper(oldList)
            cacheList.removeWhere(v => v == old)
            if (cacheList.isDirty()) {
              oldList = cacheList.get()
              updateVersion()
            }
          })
        }
      }
    })

    const addHide = wait() == 'out-in' && thisRemoveList.length != 0
    let nextIndex = 0
    for (let i = 0, len = list.length; i < len; i++) {
      const v = list[i]
      const oldIndex = newCacheList.get().findIndex(old => !old.exiting && old.value == v)
      if (oldIndex < 0) {
        if (mode() == 'shift') {
          while (newCacheList.get()[nextIndex]?.exiting) {
            nextIndex++
          }
        }
        const cache: ExitModelInner<T> = {
          value: v,
          target: {
            value: v,
            exiting() {
              //不像renderForEach在内部访问,所以没有循环访问
              getList()
              return cache.exiting
            },
            resolve(v) {
              cache.resolve?.(v)
            },
            promise() {
              return cache.promise
            }
          },
          exiting: false,
          enterIgnore: enterIgnore(v),
          hide: addHide
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

    const removeHide = wait() == 'in-out' && thisAddList.length != 0
    thisRemoveList.forEach(row => {
      row.hide = removeHide
    })

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
          if (opHelperHide(cacheList, thisAddList)) {
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
          const cacheList = new ArrayHelper(oldList)
          if (opHelperHide(cacheList, thisRemoveList)) {
            oldList = cacheList.get()
            updateVersion()
          }
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
    if (newCacheGenerateList == lastGenerateList) {
      return lastReturn || emptyArray
    }
    lastGenerateList = newCacheGenerateList
    return newCacheGenerateList.map(getExitModel)
  })
  return getList
}

export type ExitModel<V> = {
  readonly value: V
  readonly exiting: GetValue<boolean>
  readonly resolve: SetValue<any>
  readonly promise: GetValue<Promise<any> | undefined>
}

function getExitModel<V>(v: ExitModelInner<V>) {
  return v.target
}

interface ExitModelInner<V> {
  value: V
  exiting: boolean
  target: ExitModel<V>
  readonly enterIgnore?: false
  /** */
  promise?: Promise<any>
  resolve?(v?: any): void
  /**选排位置,但隐藏 */
  hide?: boolean
}

function hideAsShowAndRemoteHide<T>(v: ExitModelInner<T>, i: number, array: ArrayHelper<ExitModelInner<T>>) {
  if (v.hide) {
    array.removeAt(i)
  }
}

function opHelperHide<V>(eCacheList: NoInsertArrayHelper<ExitModelInner<V>>, thisRemoveList: ExitModelInner<V>[]) {
  let n = 0
  eCacheList.forEach(function (cache) {
    if (cache.hide) {
      const row = thisRemoveList.find(v => v == cache)
      if (row) {
        row.hide = false
        n++
      }
    }
  })
  return n
}
