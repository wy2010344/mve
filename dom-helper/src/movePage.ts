
import { MoveEnd, pointerMoveDir } from "wy-dom-helper"
import { addEffect, AnimateSignal, batchSignalEnd, Compare, DeltaXSignalAnimationConfig, eventGetPageX, eventGetPageY, FrictionalFactory, GetValue, memo, PointKey, ScrollFromPage, spring, WeightMeasure } from "wy-helper"
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
  callback: (direction: 1 | -1, velocity: number) => void
}
export function movePage(
  scroll: AnimateSignal,
  getSize: GetValue<number>,
  getPageSnap: (velocity: number) => DeltaXSignalAnimationConfig = defaultGetPageSnap
) {
  //翻页时的全局速度
  let globalDirectionVelocity = 0
  return {
    getOnPointerDown(
      {
        direction,
        onMoveBegin,
        callback,
        getDistanceFromVelocity = defaultGetDistanceFromVelocity
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
                  scroll.changeDiff(delta)
                },
                onFinish(velocity) {
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
    },
    hookCompare<T>(getValue: GetValue<T>, compare: SortFun<T>) {
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
  }
}
export type SortFun<T> = (a: T, b: T) => number
import { hookTrackSignal } from "mve-helper"


export type MovePageConfig<T> = {
  scroll: AnimateSignal
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
export function hookSimpleMovePage<T>(container: HTMLElement, {
  scroll,
  getSize,
  getValue,
  compare,
  ...args
}: MovePageConfig<T>) {
  const mp = movePage(scroll, getSize
    || (args.direction == 'x'
      ? (() => container.clientWidth)
      : (() => container.clientHeight)))
  container.addEventListener('pointerdown', mp.getOnPointerDown(args))
  mp.hookCompare(getValue, compare)
}
export function pluginSimpleMovePage<T>(config: MovePageConfig<T>) {
  return function (container: HTMLElement) {
    return hookSimpleMovePage(container, config)
  }
}