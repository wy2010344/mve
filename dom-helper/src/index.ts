import { hookAddDestroy } from "mve-core"
import { animateFrame } from "wy-dom-helper"
import { createAnimateSignal, defaultSpringBaseAnimationConfig, GetDeltaXAnimationConfig, GetValue } from "wy-helper"

export function animateSignal(
  get: GetValue<number>,
  config: GetDeltaXAnimationConfig = defaultSpringBaseAnimationConfig
) {
  const [ret, destroy] = createAnimateSignal(animateFrame, get, config)
  hookAddDestroy(destroy)
  return ret
}
