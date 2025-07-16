
import { animateSignal, pointerMoveDir } from "wy-dom-helper"
import { addEffect, batchSignalEnd, DeltaXSignalAnimationConfig, emptyObject, eventGetPageX, eventGetPageY, GetValue, memo, PointKey, ScrollFromPage, spring } from "wy-helper"
import { defaultGetDistanceFromVelocity } from "./centerPicker"

export function defaultGetPageSnap(velocity: number) {
  //使用弹性
  return spring({
    initialVelocity: velocity,
    config: {
      zta: 0.8
    }
  })
}

export type MovePageProps = {
  direction: PointKey
  onMoveBegin?(): void
  getDistanceFromVelocity?(velocity: number): number
  disableLeft?(): boolean
  disableRight?(): void
  callback: (direction: 1 | -1, velocity: number) => void
}
export function movePage(
  {
    getPageSnap = defaultGetPageSnap
  }: {
    getPageSnap?(velocity: number): DeltaXSignalAnimationConfig
  } = emptyObject
) {
  const scroll = animateSignal(0)
  //翻页时的全局速度
  let globalDirectionVelocity = 0

  let inited = false
  function init(
    getSize: GetValue<number>
  ) {
    if (inited) {
      throw 'only allow init once'
    }
    inited = true
    function getOnPointerDown(
      {
        direction,
        onMoveBegin,
        callback,
        getDistanceFromVelocity = defaultGetDistanceFromVelocity,
        disableLeft,
        disableRight
      }: MovePageProps
    ) {
      return pointerMoveDir(function () {
        return {
          onMove(e, dir) {
            if (dir == direction) {
              onMoveBegin?.()
              return ScrollFromPage.from(e, {
                getPage: direction == 'x' ? eventGetPageX : eventGetPageY,
                scrollDelta(delta) {
                  const v = scroll.get() + delta
                  if (disableLeft?.() && v > 0) {
                    return
                  }
                  if (disableRight?.() && v < 0) {
                    return
                  }
                  scroll.changeTo(v)
                },
                onFinish(velocity) {
                  if (disableLeft?.() && velocity > 0) {
                    return
                  }
                  if (disableRight?.() && velocity < 0) {
                    return
                  }
                  const distance = getDistanceFromVelocity(velocity)
                  const targetDis = distance + scroll.get()
                  const absTargetDis = Math.abs(targetDis)
                  if (absTargetDis < getSize() / 2) {
                    //恢复原状
                    scroll.changeTo(
                      0,
                      //效果不太好,有速度就变化
                      getPageSnap(velocity),
                    )
                  } else {
                    const direction = targetDis > 0 ? 1 : -1
                    globalDirectionVelocity = velocity
                    callback(direction, velocity)
                    batchSignalEnd()
                  }
                }
              })
            }
          }
        }
      })
    }

    function hookCompare<T>(getValue: GetValue<T>, compare: SortFun<T>) {
      hookTrackSignal(memo<T>((lastValue, init) => {
        const d = getValue()
        if (init) {
          const direction = Math.sign(compare(d, lastValue!))
          if (direction) {
            addEffect(() => {
              const diffSize = direction * getSize()
              scroll.changeTo(
                diffSize,
                getPageSnap(globalDirectionVelocity),
              )
              globalDirectionVelocity = 0
              scroll.silentDiff(-diffSize)
            })
          }
        }
        return d
      }))
    }
    return {
      getOnPointerDown,
      hookCompare
    }
  }
  return {
    onAnimation: scroll.onAnimation,
    get: scroll.get,
    init
  }
}

export type MovePageInit = ReturnType<(typeof movePage)>['init']

export type SortFun<T> = (a: T, b: T) => number
import { hookTrackSignal } from "mve-helper"


export type MovePageConfig<T> = {
  getSize?(): number,
  getValue(): T,
  /**
   * a>b 返回1
   * a<b 返回-1
   * @param a 
   * @param b 
   */
  compare: SortFun<T>
} & MovePageProps
export function hookSimpleMovePage<T>(
  container: HTMLElement,
  init: MovePageInit,
  {
    getSize,
    getValue,
    compare,
    ...args
  }: MovePageConfig<T>) {
  const out = init(getSize
    || (args.direction == 'x'
      ? (() => container.clientWidth)
      : (() => container.clientHeight)))
  container.addEventListener('pointerdown', out.getOnPointerDown(args))
  out.hookCompare(getValue, compare)
}
export function pluginSimpleMovePage<T>(init: MovePageInit, config: MovePageConfig<T>) {
  return function (container: HTMLElement) {
    return hookSimpleMovePage(container, init, config)
  }
}