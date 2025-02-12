import { createSignal, initRWValue } from "wy-helper";

export function valueSignal<T>(v: T) {
  const n = createSignal(v)
  return initRWValue(n.get, n.set)
}