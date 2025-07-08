import { fdom } from "mve-dom";
import { topContext } from "./context";
import { getInterpolate, getYearMonthDays, mapInterpolateRange, memoFun, mixNumber, numberIntFillWithN0, StoreRef, YearMonthDayVirtualView } from "wy-helper";
import { centerPicker } from "mve-dom-helper";


export default function (date: StoreRef<YearMonthDayVirtualView>) {
  const { yearMonthScrollY, scrollYearMonthOpenHeight } = topContext.consume()

  const interpolateH = memoFun(() => {
    return getInterpolate({
      0: scrollYearMonthOpenHeight(),
      [scrollYearMonthOpenHeight()]: 0
    }, function (x, low, last, row) {
      if (low) {
        //拖过界时,继续
        return mapInterpolateRange(x, last, row, mixNumber)
      }
      //使用clip
      return row[1]
    })
  })
  fdom.div({
    s_height() {
      return interpolateH(yearMonthScrollY.get()) + 'px'
    },
    children() {
      fdom.div({
        s_height() {
          return scrollYearMonthOpenHeight() + 'px'
        },
        s_transform() {
          return `translateY(${-yearMonthScrollY.get()}px)`
        },
        className: 'relative w-full',
        children() {
          fdom.div({
            className: 'absolute inset-0 flex items-stretch justify-center',
            children() {
              fdom.div({
                className: "flex-1 relative flex flex-col justify-center overflow-hidden",
                ...centerPicker({
                  height: scrollYearMonthOpenHeight,
                  cellHeight: 44,
                  value: {
                    get() {
                      return date.get().year
                    },
                    set(v) {
                      const d = date.get()
                      if (d.year != v) {
                        const days = Math.min(getYearMonthDays(v, d.month), d.day)
                        date.set(YearMonthDayVirtualView.from(v, d.month, days))
                      }
                    },
                  },

                  renderCell(i) {
                    fdom.div({
                      className: 'h-11 text-center flex items-center justify-center',
                      childrenType: "text",
                      children: numberIntFillWithN0(i, 2)
                    })
                  },
                })
              })
              fdom.div({
                className: "flex-1 relative flex flex-col justify-center overflow-hidden",
                ...centerPicker({
                  height: scrollYearMonthOpenHeight,
                  cellHeight: 44,
                  value: {
                    get() {
                      return date.get().month
                    },
                    set(v) {
                      const d = date.get()
                      if (v != d.month) {
                        const days = Math.min(getYearMonthDays(d.year, v), d.day)
                        date.set(YearMonthDayVirtualView.from(d.year, v, days))
                      }
                    },
                  },
                  circle: {
                    baseIndex: 1,
                    count: 12
                  },
                  renderCell(i) {
                    fdom.div({
                      className: 'h-11 text-center flex items-center justify-center',
                      childrenType: "text",
                      children: numberIntFillWithN0(i, 2)
                    })
                  },
                })
              })
            }
          })
          fdom.div({
            className: 'absolute inset-0 flex flex-col items-stretch justify-center pointer-events-none ',
            children() {
              fdom.div({
                className: 'flex-1 bg-linear-to-b from-base-100 to-100% to-base-100/90'
              })
              fdom.div({
                className: 'h-11 flex flex-col justify-center',
              })
              fdom.div({
                className: 'flex-1 bg-linear-to-t from-base-100 to-100% to-base-100/90'
              })
            }
          })
        }
      })
    }
  })
}