import { addEffect, EmptyFun, emptyObject, GetValue, SetValue } from "wy-helper"
import { getHistoryState } from "../history"
import { hookDestroy } from "mve-helper"
import { createPop } from "mve-dom-helper"
import { hookAddResult } from "mve-core"
import { animate, AnimationOptions } from 'motion'
import { fdom } from "mve-dom"
import { Action } from "history"
import { cns } from "wy-dom-helper"
export function getTabsDirection(findTabIndex: (n: string) => number) {
  const { beforePathname, pathname } = getHistoryState()
  if (!beforePathname) {
    return
  }
  const beforeIndex = findTabIndex(beforePathname)
  if (beforeIndex < 0) {
    return
  }
  const index = findTabIndex(pathname)
  if (index < 0) {
    return
  }
  if (beforeIndex < index) {
    return 'toRight'
  }
  if (beforeIndex > index) {
    return 'toLeft'
  }
}

export type PageDirection = 'toRight' | 'toLeft'

export function hookTabPage(
  getDirection: GetValue<PageDirection | undefined>,
  div: HTMLElement, {
    createPop: createPopI = createPop,
    animationConfig = {
      type: "tween",
      // duration: 100
    },
    exitContainerClassName,
    getContainer = () => {
      const rect = div.getBoundingClientRect()
      return (children) => {
        return fdom.div({
          className: cns('fixed overflow-hidden', exitContainerClassName),
          s_left: rect.left + 'px',
          s_top: rect.top + 'px',
          s_width: rect.width + 'px',
          s_height: rect.height + 'px',
          children
        })
      }
    }
  }: {
    createPop?(callback: SetValue<EmptyFun>): void,
    animationConfig?: AnimationOptions,
    exitContainerClassName?: string
    getContainer?(): (children: EmptyFun) => HTMLElement
  } = emptyObject) {
  addEffect(() => {
    const direction = getDirection()
    if (direction) {
      animate(div, {
        x: direction == 'toLeft' ? ['-100%', 0] : ['100%', 0]
      }, animationConfig)
    }
  })
  hookDestroy(() => {
    const container = getContainer()
    addEffect(() => {
      const direction = getDirection()
      if (direction) {
        createPopI((close) => {
          const div2 = container(() => {
            hookAddResult(div)
          })
          addEffect(() => {
            animate(div2, {
              x: direction == 'toLeft' ? [0, '100%'] : [0, '-100%']
            }, animationConfig).then(close as EmptyFun)
          })
        })
      }
    })
  })
}

export function hookPage(div: HTMLElement) {
  hookTabPage(() => getHistoryState().action == Action.Pop ? 'toLeft' : 'toRight', div,)
}