import { hookDestroy, hookTrackSignal } from "mve-helper"
import { moveEdgeScroll, subscribeEventListener } from "wy-dom-helper"
import { EdgeScrollConfig, EmptyFun, emptyFun, GetValue, PointKey } from "wy-helper"

export function pluginEdgeScroll({
  shouldMeasure,
  direction,
  multi,
  config
}: {
  shouldMeasure: GetValue<any>,
  direction: PointKey,
  multi?: number
  config?: EdgeScrollConfig
}) {
  return function (container: HTMLElement) {
    let mes: ReturnType<typeof moveEdgeScroll> | undefined = undefined
    let destroy: EmptyFun = emptyFun
    hookDestroy(() => {
      mes?.destroy()
      destroy()
    })
    hookTrackSignal(shouldMeasure, function (bool) {
      if (bool) {
        destroy = subscribeEventListener(window, "pointermove", function (e) {
          const point = direction == 'x' ? e.pageX : e.pageY
          if (mes) {
            mes.changePoint(point)
          } else {
            mes = moveEdgeScroll(container, {
              point,
              config,
              direction,
              multi
            })
          }
        })
      } else {
        mes?.destroy()
        mes = undefined
        destroy()
      }
    })
  }
}