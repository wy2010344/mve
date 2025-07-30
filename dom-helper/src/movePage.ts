
import { animateSignal, pointerMoveDir } from "wy-dom-helper"
import { addEffect, alawaysFalse, AnimateSignal, batchSignalEnd, DeltaXSignalAnimationConfig, emptyObject, eventGetPageX, eventGetPageY, FalseType, GetValue, memo, PointKey, Quote, ScrollFromPage, spring, ScrollDelta, StoreRef, valueOrGetToGet, PagePoint } from "wy-helper"
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
  scrollEndToChange?: boolean
  getDistanceFromVelocity?(velocity: number): number
  callback: (direction: 1 | -1, velocity: number) => void | boolean
}

export function movePage({
  getPageSnap = defaultGetPageSnap,
  getSize,
}: {
  //延迟获得
  getSize: GetValue<number>,
  getPageSnap?(velocity: number): DeltaXSignalAnimationConfig
}) {
  const scroll = animateSignal(0)
  //翻页时的全局速度
  function getMoveEvent(e: PointerEvent,
    direction: PointKey, {
      scrollEndToChange,
      getDistanceFromVelocity = defaultGetDistanceFromVelocity,
      callback
    }: MovePageProps) {
    return ScrollFromPage.from(e, {
      getPage: direction == 'x' ? eventGetPageX : eventGetPageY,
      scrollDelta(delta: number, velocity: number, inMove?: boolean) {
        const c = scroll.get()
        const v = c + delta
        scroll.set(v)
        if (inMove) {
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
          const dis = scrollEndToChange ? Math.min(absTargetDis, getSize()) * direction : getSize() * direction
          scroll.animateTo(dis, getPageSnap(velocity)).then((value) => {
            if (!value) {
              return
            }
            //成功的情况下
            const cancel = callback(direction, velocity)
            if (cancel) {
              scroll.changeTo(
                0,
                //效果不太好,有速度就变化
                getPageSnap(0),
              )
            } else {
              batchSignalEnd()
            }
          })
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
            const diff = scroll.get() - diffSize
            if (diff) {
              //状态变化造成,也可能是拖拽速度未到达终点
              scroll.animateTo(
                diffSize,
                getPageSnap(0),
              )
              scroll.silentDiff(-diffSize)
            } else {
              //拖拽造成
              scroll.set(0)
            }
          })
        }
      }
      return d
    }))
  }
  return {
    getSize,
    onAnimation: scroll.onAnimation,
    get: scroll.get,
    getMoveEvent,
    hookCompare
  }
}

export type SortFun<T> = (a: T, b: T) => number
import { hookTrackSignal } from "mve-helper"

export type MovePageConfig<T> = {
  getPageSnap?(velocity: number): DeltaXSignalAnimationConfig
  direction: PointKey
  getSize?(): number,
  getValue(): T,
  /**
   * a>b 返回1
   * a<b 返回-1
   * @param a 
   * @param b 
   */
  compare: SortFun<T>
} & Omit<MovePageProps, 'getSize'>


export function createSimpleMovePage<T>(
  {
    getPageSnap,
    getSize,
    getValue,
    compare,
    direction,
    ...args
  }: MovePageConfig<T>) {
  let container!: HTMLElement
  const out = movePage({
    getSize: getSize
      || (direction == 'x'
        ? (() => container.clientWidth)
        : (() => container.clientHeight)),
    getPageSnap
  })
  out.hookCompare(getValue, compare)
  //作为plubin
  return {
    ...out,
    plugin(c: HTMLElement) {
      container = c
      container.addEventListener('pointerdown', e => {
        pointerMoveDir(e, {
          onMove(e, dir, v) {
            if (dir == direction) {
              return out.getMoveEvent(e, direction, args)
            }
          }
        })
      })
    }
  }
}