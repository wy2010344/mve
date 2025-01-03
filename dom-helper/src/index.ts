import { hookAddDestroy } from "mve-core"
import { signalAnimateFrame } from "wy-dom-helper"
import { createAnimateSignal, defaultSpringBaseAnimationConfig, GetDeltaXAnimationConfig, GetValue } from "wy-helper"
export * from './canvasRender'
export * from './absoluteRender'
export * from './renderInput'
export * from './renderCode'
export * from './useContentEditable'
export * from './canvasRender/hookDrawImage'
export * from './canvasRender/hookDrawRect'
export * from './canvasRender/hookDrawText'
export function animateSignal(
  get: GetValue<number>,
  config: GetDeltaXAnimationConfig = defaultSpringBaseAnimationConfig
) {
  const [ret, destroy] = createAnimateSignal(signalAnimateFrame, get, config)
  hookAddDestroy()(destroy)
  return ret
}
