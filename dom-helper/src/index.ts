import { hookAddDestroy } from "mve-core"
import { signalAnimateFrame } from "wy-dom-helper"
import { AnimateFrameSignalConfig, createAnimateSignal, defaultSpringBaseAnimationConfig, GetDeltaXAnimationConfig, GetValue, SignalAnimateFrameValue } from "wy-helper"
export * from './canvasRender'
export * from './absoluteRender'
export * from './renderInput'
export * from './renderCode'
export * from './useContentEditable'
export * from './canvasRender/hookDrawImage'
export * from './canvasRender/hookDrawRect'
export * from './canvasRender/hookDrawText'
export * from './renderExitArray'
export function animateSignal(
  get: GetValue<number>,
  config?: AnimateFrameSignalConfig
) {
  const [ret, destroy] = createAnimateSignal(signalAnimateFrame, get, config)
  hookAddDestroy()(destroy)
  return ret
}
