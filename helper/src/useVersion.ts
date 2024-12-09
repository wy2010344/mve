import { createSignal } from "wy-helper";
export function useVersion(init = 0, step = 1) {
  const version = createSignal(init)
  return [version.get, function () {
    version.set(version.get() + step)
  }] as const
}