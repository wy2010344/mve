import { animate, AnimationOptions } from "motion"
import { hookTrackSignal } from "mve-helper"
import { addEffect, GetValue, PointKey } from "wy-helper"

export function pluginLayoutIndex(
  getIndex: GetValue<number>,
  direction: PointKey,
  config?: AnimationOptions
) {
  return function (
    div: HTMLElement,
  ) {
    const offsetKey = direction == 'x' ? 'offsetLeft' : 'offsetTop'
    let before = -1
    hookTrackSignal(getIndex, function (index) {
      addEffect(() => {
        if (before >= 0) {
          const diff = before - div[offsetKey]
          if (!diff) {
            return
          }
          animate(div, {
            [direction]: [diff, 0]
          }, config)
        }
        before = div[offsetKey]
      })
    })
  }
}