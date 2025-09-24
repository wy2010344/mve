import { renderForEach } from 'mve-core'
import { fdom } from 'mve-dom'
import { hookTrackSignal } from 'mve-helper'
import { animateSignal, pointerMove } from 'wy-dom-helper'
import {
  addEffect,
  circleFindNearst,
  circleFormat,
  ClampingScrollFactory,
  createSignal,
  defaultSpringAnimationConfig,
  DeltaXSignalAnimationConfig,
  emptyObject,
  eventGetPageY,
  FrictionalFactory,
  numberBetween,
  Quote,
  quote,
  scrollForEdge,
  ScrollFromPage,
  ScrollHelper,
  StoreRef,
  ValueOrGet,
  valueOrGetToGet,
  WithTimeStampEvent,
} from 'wy-helper'

export function defaultGetDistanceFromVelocity(
  velocity: number,
  deceleration?: number
) {
  return FrictionalFactory.get(deceleration).getFromVelocity(velocity).distance
}

export type CenterPickerProps = {
  getDistanceFromVelocity?(velocity: number): number
  animationConfig?: DeltaXSignalAnimationConfig
  realTimeValue?: StoreRef<number>
  /**
   * 要么是无限的,要么是有限的,有限就是circle
   */
  circle?: {
    /**和0的距离,比如如果是从1开始,就是1*/
    baseIndex?: ValueOrGet<number>
    /**总数量,比如12个月,就是12 */
    count: ValueOrGet<number>
  }
  disabled?(i: number): any
}

export type RangePickerProps = {
  disabled?(i: number): any
  animationConfig?: DeltaXSignalAnimationConfig
  getFrictional?(v: number): ScrollHelper
}
/**
 *
 * @param _cellHeight 行高
 * @param _size 记录数量
 * @param value 实时的值
 * @param param3
 * @returns
 */
export function rangePicker(
  _cellHeight: ValueOrGet<number>,
  _size: ValueOrGet<number>,
  value: StoreRef<number>,
  {
    disabled,
    animationConfig = defaultSpringAnimationConfig,
    getFrictional = (v) => ClampingScrollFactory.get().getFromVelocity(v),
  }: RangePickerProps = emptyObject
) {
  const cellHeight = valueOrGetToGet(_cellHeight)
  const size = valueOrGetToGet(_size)
  const scrollY = animateSignal(0)

  hookTrackSignal(value.get, function (v) {
    if (scrollY.onAnimation()) {
      scrollY.silentChangeTo(v * cellHeight())
    } else {
      scrollY.changeTo(v * cellHeight(), animationConfig)
    }
  })
  return {
    scroll: scrollY.get,
    beginMove<T extends WithTimeStampEvent>(
      e: T,
      getPage: (v: T) => number,
      {
        whenMove,
      }: {
        whenMove?(e: T, inMove: boolean): void
      } = emptyObject
    ) {
      scrollY.stop()
      return ScrollFromPage.from(e, {
        getPage,
        scrollDelta(delta, velocity, inMove, e) {
          whenMove?.(e, inMove)
          scrollForEdge(scrollY, delta, cellHeight(), size() * cellHeight())
          if (inMove) {
            return
          }
          const maxScroll = (size() - 1) * cellHeight()
          const frictional = getFrictional(velocity)
          let idealIndex = Math.round(
            numberBetween(0, scrollY.get() + frictional.distance, maxScroll) /
              cellHeight()
          )
          if (disabled) {
            const dir = Math.sign(delta)
            let tempIndex = idealIndex
            const s = size()
            function satify() {
              return -1 < tempIndex && tempIndex < s
            }
            while (disabled(tempIndex) && satify()) {
              tempIndex = tempIndex + dir
            }
            if (satify()) {
              idealIndex = tempIndex
            } else {
              tempIndex = idealIndex - 1
              while (disabled(tempIndex) && satify()) {
                tempIndex = tempIndex - dir
              }
              if (satify()) {
                idealIndex = tempIndex
              } else {
                console.warn('不合法的index', tempIndex)
                throw `不合法的index, ${tempIndex}`
              }
            }
          }
          scrollY.changeTo(idealIndex * cellHeight(), animationConfig)
          value.set(idealIndex)
        },
      })
    },
  }
}

export function baseCenterPicker(
  _cellHeight: ValueOrGet<number>,
  value: StoreRef<number>,
  {
    animationConfig = defaultSpringAnimationConfig,
    getDistanceFromVelocity = defaultGetDistanceFromVelocity,
    realTimeValue = createSignal(value.get()),
    circle,
    disabled,
  }: CenterPickerProps = emptyObject
) {
  const cellHeight = valueOrGetToGet(_cellHeight)
  const scrollY = animateSignal(0)
  const getCount = valueOrGetToGet(circle?.count || 0)
  const getCircleDiff = valueOrGetToGet(circle?.baseIndex || 0)

  const getRealValue: Quote<number> = circle
    ? (newValue: number) => {
        const circleDiff = getCircleDiff()
        return circleFormat(newValue - circleDiff, getCount()) + circleDiff
      }
    : quote

  function addValue(needAdd: number) {
    const newValue = realTimeValue.get() + needAdd
    realTimeValue.set(getRealValue(newValue))
  }
  function didChange() {
    const needAdd = Math.floor(scrollY.get() / cellHeight())
    if (needAdd) {
      scrollY.silentDiff(-needAdd * cellHeight())
      addValue(needAdd)
    }
  }
  hookTrackSignal(value.get, function (v) {
    let diff = v - realTimeValue.get()
    if (circle) {
      diff = circleFindNearst(diff, getCount())
    }
    if (diff) {
      /**
       * 这个对于周期的循环并不友好
       */
      addEffect(() => {
        const snapTarget = diff * cellHeight()
        scrollY.changeTo(snapTarget, animationConfig, didChange)
      })
    }
  })
  return {
    realTimeValue: realTimeValue.get,
    beginMove<T extends WithTimeStampEvent>(
      e: T,
      getPage: (v: T) => number,
      {
        whenMove,
      }: {
        whenMove?(e: T, inMove: boolean): void
      } = emptyObject
    ) {
      scrollY.stop()
      return ScrollFromPage.from(e, {
        getPage,
        scrollDelta(delta, velocity, inMove, e) {
          whenMove?.(e, inMove)
          scrollY.changeDiff(delta)
          didChange()
          if (inMove) {
            return
          }
          const distance = getDistanceFromVelocity(velocity)
          const targetDis = distance + scrollY.get()
          let diffValue = Math.round(targetDis / cellHeight())
          if (disabled) {
            const dir = Math.sign(delta)
            const v = realTimeValue.get()
            if (circle) {
              while (disabled(getRealValue(diffValue + v))) {
                diffValue = diffValue + dir
              }
            } else {
              while (disabled(diffValue + v)) {
                diffValue = diffValue + dir
              }
            }
          }
          scrollY
            .animateTo(diffValue * cellHeight(), animationConfig, didChange)
            .then(() => {
              didChange()
              value.set(realTimeValue.get())
            })
        },
      })
    },
    /**
     * 通常需要一个子容器来承载偏移
     */
    scroll: scrollY.get,
    renderList(
      _height: ValueOrGet<number>,
      renderCell: (i: number, disabled: any) => void
    ) {
      const height = valueOrGetToGet(_height)
      renderForEach<number>(
        function (callback) {
          const v = realTimeValue.get()
          //需要是奇数
          const length = Math.ceil(height() / cellHeight())
          //如果是偶数
          const half = Math.floor(length / 2)
          for (let i = v - half; i <= v + half; i++) {
            const key = getRealValue(i)
            callback(key, key)
          }
        },
        function (key, et) {
          renderCell(key, disabled?.(key))
        }
      )
    },
  }
}

export function centerPicker(
  args: CenterPickerProps & {
    cellHeight: ValueOrGet<number>
    height: ValueOrGet<number>
    value: StoreRef<number>
    renderCell(i: number): void
  }
) {
  const v = baseCenterPicker(args.cellHeight, args.value, args)
  return {
    onPointerDown(e: PointerEvent) {
      pointerMove(v.beginMove(e, eventGetPageY))
    },
    children() {
      fdom.div({
        s_transform() {
          return `translateY(${-v.scroll()}px)`
        },
        children() {
          v.renderList(args.height, args.renderCell)
        },
      })
    },
  }
}
