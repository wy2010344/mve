import { EachTime, renderForEach, RenderForEachArg } from "mve-core"
import { arrayEqual, arrayNotEqualOrOne, asLazy, Compare, emptyArray, emptyObject, GetValue, memo, normalMapCreater, quote, ReadArray, RMap, run, SetValue, simpleEqual } from "wy-helper"



export function renderArrayP<T>(
  getVs: GetValue<ReadArray<T>> | ReadArray<T>,
  render: (value: T, getIndex: GetValue<number>) => void,
  createMap?: <V>() => RMap<any, V>
) {
  if (typeof getVs == 'function') {
    renderArray(getVs, render, createMap)
  } else {
    for (let i = 0; i < getVs.length; i++) {
      const v = getVs[i]
      render(v, asLazy(i))
    }
  }
}

export function renderArray<T>(
  getVs: GetValue<ReadArray<T>>,
  render: (value: T, getIndex: GetValue<number>) => void,
  createMap?: <V>() => RMap<any, V>) {

  renderForEach<T, T, void>(
    function (callback) {
      const vs = getVs()
      for (let i = 0; i < vs.length; i++) {
        const v = vs[i]
        callback(v, v)
      }
    },
    function (key, et) {
      render(key, et.getIndex)
    },
    {
      createMap,
      bindIndex: true
    })
}

export function renderSet<T>(
  getSet: GetValue<{
    forEach(callback: SetValue<T>): void
  }>,
  render: (item: T, getIndex: GetValue<number>) => void
) {
  renderForEach<T, T, void>(
    function (callback) {
      const set = getSet()
      set.forEach(function (item) {
        callback(item, item)
      })
    }, function (key, et) {
      render(key, et.getIndex)
    },
    {
      bindIndex: true
    }
  )
}

export function renderMap<K, V>(
  getMap: GetValue<{
    forEach(callback: (a: V, b: K) => void): void
  }>,
  render: (key: K, item: GetValue<V>, getIndex: GetValue<number>) => void
) {
  renderForEach<V, K, void>(
    function (callback) {
      const set = getMap()
      set.forEach(function (value, key) {
        callback(key, value)
      })
    },
    function (key, et) {
      render(key, et.getValue, et.getIndex)
    },
    {
      bindIndex: true,
      bindValue: true
    }
  )
}

export function memoEqual<T>(get: GetValue<T>, equal: Compare<T>) {
  return memo<T>(function (old, init) {
    const newValue = get()
    if (init) {
      if (equal(newValue, old!)) {
        return old!
      }
      return newValue
    }
    return newValue
  })
}

export function memoEqualDep<T>(get: GetValue<T>, toDeps: (v: T) => any) {
  return memoEqual(get, function (a, b) {
    return !arrayNotEqualOrOne(toDeps(a), toDeps(b))
  })
}
export function memoMapArray<T, V>(
  get: GetValue<readonly T[]>,
  to: (v: T) => V,
  same: (v: T, f: T) => any = simpleEqual
) {
  const list = memo<{
    from: T,
    to: V
  }[]>(function (old, init) {
    const newValue = get()
    if (init) {
      const oldlist = old!
      if (newValue.length == oldlist.length) {
        let isSame = true
        for (let i = 0; i < newValue.length && isSame; i++) {
          const nv = newValue[i]
          const ov = oldlist[i]
          isSame = same(nv, ov.from)
        }
        if (isSame) {
          return oldlist
        }
      }
      return newValue.map(v => {
        const idx = old!.findIndex(x => same(x.from, v))
        if (idx < 0) {
          return {
            from: v,
            to: to(v)
          }
        }
        return old![idx]
      })
    }
    return newValue.map(v => {
      return {
        from: v,
        to: to(v)
      }
    })
  })
  return memo(() => list().map(v => v.to))
}
/**
 * 对数组里面的列表进行缓存
 * @param getVs 
 * @param equal 
 * @returns 
 */
export function memoArray<T, VS extends ReadArray<T>>(getVs: GetValue<VS>, equal: Compare<T> = simpleEqual) {
  return memoEqual(getVs, function (a, b) {
    return arrayEqual(a, b, equal)
  })
}

export function renderArrayToMap<T, O, K = T>(
  getVs: GetValue<ReadArray<T>>,
  render: (key: K, et: EachTime<T>) => O,
  getKey: ((v: T, i: number) => K) = quote as any,
  arg: RenderForEachArg = emptyObject
): GetValue<RMap<K, GetValue<O>>> {
  const createMap = arg.createMap || normalMapCreater
  let gets: RMap<K, GetValue<O>>
  const getSignal = renderForEach<T, K, O>(
    function (callback) {
      const vs = getVs()
      gets = createMap<K, GetValue<O>>()
      for (let i = 0; i < vs.length; i++) {
        const v = vs[i]
        const key = getKey(v, i)
        const get = callback(key, v)
        gets.set(key, get)
      }
    }, render, arg)
  return function () {
    getSignal()
    return gets
  }
}


export function renderArrayKey<T, K>(
  getVs: GetValue<ReadArray<T>>,
  getKey: ((v: T, i: number) => K),
  render: (getValue: GetValue<T>, getIndex: GetValue<number>, key: K) => void,
  createMap?: <K, V>() => RMap<K, V>
) {
  renderForEach<T, K, void>(function (callback) {
    const vs = getVs()
    for (let i = 0; i < vs.length; i++) {
      const v = vs[i]
      const key = getKey(v, i)
      callback(key, v)
    }
  }, function (key, et) {
    render(et.getValue, et.getIndex, key)
  }, {
    createMap,
    bindOut: true,
    bindIndex: true,
    bindValue: true
  })
}


export function renderArrayToArray<T, O>(
  getVs: GetValue<ReadArray<T>>,
  render: (get: T, getIndex: GetValue<number>) => O,
  createMap?: <K, V>() => RMap<K, V>
): GetValue<O[]> {
  let gets: GetValue<O>[]
  const getSignal = renderForEach<T, T, O>(
    function (callback) {
      const vs = getVs()
      gets = []
      for (let i = 0; i < vs.length; i++) {
        const v = vs[i]
        const get = callback(v, v)
        gets.push(get)
      }
    }, function (key, et) {
      return render(key, et.getIndex)
    },
    {
      bindOut: true,
      bindIndex: true,
      createMap
    })
  return function () {
    getSignal()
    return gets.flatMap(run)
  }
}