import { hookAddDestroy } from "mve-core";
import { GetValue, SetValue, trackSignal } from "wy-helper";
export * from './renderMap'

export function hookTrackSignal<T>(get: GetValue<T>, set: SetValue<T>) {
  hookAddDestroy(trackSignal(get, set))
}