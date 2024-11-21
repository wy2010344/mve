import { emptyFun, EmptyFun, GetValue } from "wy-helper";
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