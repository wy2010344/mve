import { emptyFun, EmptyFun, GetValue, quote } from "wy-helper";
import { renderArray } from "./renderMap";


export function renderIf(
  get: GetValue<any>,
  whenTrue: EmptyFun,
  whenFalse: EmptyFun = emptyFun
) {
  renderArray(() => {
    return [
      get()
    ]
  }, v => !!v, (d, key) => {
    if (key) {
      whenTrue()
    } else {
      whenFalse()
    }
  })
}



export function renderOne<K>(
  get: GetValue<K>,
  render: (v: K) => void
) {
  renderArray(() => [get()], quote, (d, key) => {
    render(key)
  })
}