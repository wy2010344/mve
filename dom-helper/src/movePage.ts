
import { MoveEnd } from "wy-dom-helper"
import { addEffect, AnimateSignal, batchSignalEnd, DeltaXSignalAnimationConfig, eventGetPageX, FrictionalFactory, GetValue, ScrollFromPage, spring, WeightMeasure } from "wy-helper"
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

export function movePage(
  scroll: AnimateSignal,
  getSize: GetValue<number>,
  getPageSnap: (velocity: number) => DeltaXSignalAnimationConfig = defaultGetPageSnap
) {
  //翻页时的全局速度
  let globalDirectionVelocity = 0
  return {
    pointerDown(
      initE: PointerEvent,
      {
        getPage = eventGetPageX,
        callback,
        getDistanceFromVelocity = defaultGetDistanceFromVelocity
      }: {
        getPage?(e: PointerEvent): number
        getDistanceFromVelocity?(velocity: number): number
        callback: (direction: 1 | -1, velocity: number) => void
      }
    ): MoveEnd<PointerEvent> {

      return ScrollFromPage.from(initE, {
        getPage,
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
    },
    changePage(direction: number) {
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
}