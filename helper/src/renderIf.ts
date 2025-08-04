import { emptyFun, EmptyFun, GetValue } from "wy-helper";
import { renderArray, renderArrayKey } from "./renderMap";


export function renderIf(
  get: any,
  whenTrue: EmptyFun,
  whenFalse: EmptyFun = emptyFun
) {
  if (typeof get == 'function') {
    renderArray(() => {
      return [
        Boolean(get())
      ]
    }, (d) => {
      if (d) {
        whenTrue(get)
      } else {
        whenFalse(get)
      }
    })
  } else {
    if (get) {
      whenTrue(get)
    } else {
      whenFalse(get)
    }
  }
}



export function renderOne<K>(
  get: GetValue<K> | K,
  render: (v: K) => void
) {
  if (typeof get == 'function') {
    renderArray(() => [(get as any)()], render)
  } else {
    render(get)
  }
}

export function renderOneKey<T, K>(
  get: GetValue<T>,
  getKey: (v: T) => K,
  render: (key: K, get: GetValue<T>) => void
) {
  renderArrayKey(() => [get()], getKey, (_, _1, key) => render(key, get))
}