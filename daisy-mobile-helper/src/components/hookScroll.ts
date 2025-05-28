import { addEffect, SetValue, tw } from "wy-helper";
import { getHistoryState, history } from "../history";
import { hookTrackSignal } from "mve-helper";

export const tabContainerClassName = tw`overflow-x-auto snap-x snap-mandatory flex items-stretch wib`
export const tabItemClassName = tw`snap-center w-full shrink-0`

export interface HrefTab {
  href: string
}

export function hookTrackIndex(tabs: HrefTab[], changeIndex: SetValue<number>) {
  hookTrackSignal(() => {
    let idx = -1
    const pathname = getHistoryState().pathname
    for (let i = 0; i < tabs.length && idx < 0; i++) {
      if (pathname.startsWith(tabs[i].href)) {
        idx = i
      }
    }
    return idx
  }, function (idx) {
    if (idx < 0) {
      return
    }
    changeIndex(idx)
  })
}

export function hookScroll(
  div: HTMLDivElement,
  tabs: HrefTab[]
) {
  div.addEventListener('scrollend', function (e) {
    const off = Math.round(div.scrollLeft / window.innerWidth)
    const href = tabs[off].href
    if (href != history.location.pathname) {
      history.replace(href)
    }
  })
  hookTrackIndex(tabs, (idx) => {
    addEffect(() => {
      div.scrollTo({
        left: idx * window.innerWidth,
        behavior: "smooth",
      })
    })
  })
}