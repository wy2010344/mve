import { hookDestroy } from "mve-helper"
import { batchSignalEnd, createSignal } from "wy-helper"

export function getWriteModeDirection(n: Element) {
  const writingMode = getComputedStyle(n).writingMode;
  if (writingMode === 'vertical-rl' || writingMode === 'vertical-lr') {
    //竖向书写
    return 'column'
  } else {
    //横向书写
    return 'row'
  }
}

/**
 * 不包含border.
 * @param e 
 * @returns 
 */
export function hookContentSizeElement(e: Element) {
  const size = createSignal({
    blockSize: e.clientHeight,
    inlineSize: e.clientWidth
  })
  const ob = new ResizeObserver((e) => {
    size.set(e[0].contentBoxSize[0])
    batchSignalEnd()
  })
  ob.observe(e)
  hookDestroy(() => {
    ob.disconnect()
  })
  return size.get
}

const borderConfig = {
  box: "border-box"
} as const
export function hookBorderSizeElement(e: Element & {
  offsetHeight: number
  offsetWidth: number
}) {
  const size = createSignal({
    blockSize: e.offsetHeight,
    inlineSize: e.offsetWidth
  })
  const ob = new ResizeObserver((e) => {
    const e0 = e[0]
    size.set(e0.borderBoxSize[0] || {
      blockSize: e0.contentRect.height,
      inlineSize: e0.contentRect.width
    })
    batchSignalEnd()
  })
  ob.observe(e, borderConfig)
  hookDestroy(() => {
    ob.disconnect()
  })
  return size.get
}