import { EmptyFun, FalseType, emptyFun, quote } from "wy-helper";
import { renderArray } from "./renderMap";
import { getOpposite } from "./useVersion";


export function renderOne(key: any, render: EmptyFun) {
  renderArray([key], quote, render)
}



export function renderIf<T>(
  value: T,
  renderTrue: (v: Exclude<T, FalseType>) => void,
  renderFalse: (v: Extract<T, FalseType>) => void = emptyFun
) {
  renderArray([value], getOpposite, function (v) {
    if (v) {
      renderTrue(v)
    } else {
      renderFalse(v)
    }
  })
}