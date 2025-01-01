import { emptyFun, EmptyFun, GetValue, quote } from "wy-helper";
import { renderArray } from "./renderMap";


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
  renderArray(() => [get()], (key) => {
    render(key)
  })
}