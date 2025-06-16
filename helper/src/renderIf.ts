import { emptyFun, EmptyFun, GetValue } from "wy-helper";
import { renderArray, renderArrayKey } from "./renderMap";


export function renderIf(
  get: GetValue<any>,
  whenTrue: EmptyFun,
  whenFalse: EmptyFun = emptyFun
) {
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
}



export function renderOne<K>(
  get: GetValue<K>,
  render: (v: K) => void
) {
  renderArray(() => [get()], render)
}

export function renderOneKey<T, K>(
  get: GetValue<T>,
  getKey: (v: T) => K,
  render: (key: K, get: GetValue<T>) => void
) {
  renderArrayKey(() => [get()], getKey, (_, _1, key) => render(key, get))
}