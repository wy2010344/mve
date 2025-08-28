import { FalseType, GetValue } from "wy-helper";
import { cns as cns0 } from 'wy-dom-helper'
function isFun(v: any) {
  return typeof v == 'function'
}
export function cns(...vs: (string | FalseType | GetValue<string | FalseType>)[]) {
  const hasFun = vs.some(isFun)
  if (hasFun) {
    return function () {
      return cns0.apply(null, vs.map(v => {
        if (isFun(v)) {
          return (v as any)()
        }
        return v
      }))
    }
  } else {
    return cns0.apply(null, vs as any[])
  }
}