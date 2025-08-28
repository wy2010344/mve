import { addEffect, GetValue, SetValue, simpleEqual, tw } from "wy-helper";
import { hookTrackSignal } from "mve-helper";

export const tabContainerClassName = tw`overflow-x-auto snap-x snap-mandatory flex items-stretch wib`
export const tabItemClassName = tw`snap-center w-full shrink-0`

export function hookXScroll<T>(
  div: HTMLDivElement,
  tabs: T[],
  get: GetValue<T>,
  set: SetValue<T>,
  equal = simpleEqual
) {
  div.addEventListener('scrollend', function (e) {
    const off = Math.round(div.scrollLeft / div.clientWidth)
    if (off < tabs.length) {
      const tab = tabs[off]
      if (!equal(tab, get())) {
        set(tab)
      }
    }
  })
  let first = true
  hookTrackSignal(get, function (v) {
    const idx = tabs.findIndex(x => equal(x, v))
    if (idx < 0) {
      return
    }
    addEffect(function () {
      div.scrollTo({
        left: idx * div.clientWidth,
        behavior: first ? "instant" : "smooth",
      })
    })
    if (first) {
      first = false
    }
  })
}