import { hookDestroy } from "mve-helper"
import { observerAnimateSignal } from "wy-dom-helper"
import { AnimateFrameSignalConfig, GetValue } from "wy-helper"
export * from './canvasRender'
export * from './absoluteRender'
export * from './renderInput'
export * from './renderCode'
export * from './useContentEditable'
export * from './renderExitArray'
export * from './centerPicker'
export * from './movePage'
export * from './pop'
export * from './three'
export * from './cns'
export * from './fakeRoute'
export * from './tsxSupport'
export function hookAnimateSignal(
  get: GetValue<number>,
  config?: AnimateFrameSignalConfig
) {
  const [ret, destroy] = observerAnimateSignal(get, config)
  hookDestroy(destroy)
  return ret
}



