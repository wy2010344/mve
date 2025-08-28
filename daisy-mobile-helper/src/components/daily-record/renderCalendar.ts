import { renderIf } from "mve-helper";
import { fdom, mdom } from "mve-dom";
import { dateFromYearMonthDay, extrapolationClamp, getInterpolate, GetValue, getWeekOfMonth, memo, memoFun, StoreRef, YearMonthDayVirtualView, YearMonthVirtualView } from "wy-helper";
import { SolarDay } from "tyme4ts";
import { firstDayOfWeekIndex, WEEKS } from "../p";
import { topContext } from "./context";
import { renderFirstDayWeek, renderWeekHeader } from "./renderWeekday";
import renderCell from "./renderCell";
export default function (
  yearMonth: YearMonthVirtualView,
  getIndex: GetValue<number>,
  calendarScrollY: GetValue<number>,
  date: StoreRef<YearMonthDayVirtualView>
) {
  const { showCalendar, calendarOpenHeight, perSize } = topContext.consume()

  function selectCurrent() {
    const d = date.get()
    const ym = yearMonth
    return d.year == ym.year && d.month == ym.month
  }
  mdom.div({
    attrs(v) {
      const i = getIndex()
      if (i == 1) {

      } else {
        v.s_position = 'absolute'
        v.s_inset = 0
        v.s_transform = `translateX(${(i - 1) * 100}%)`
      }
    },
    children() {
      renderWeekHeader(function (i) {
        return WEEKS[yearMonth.weekDay(i)]
      })
      //周这个需要snap
      const interpolateY = memoFun(() => {
        const perHeight = perSize()
        const moveHeight = calendarOpenHeight()
        const weekOfMonth = getWeekOfMonth(dateFromYearMonthDay(date.get()), firstDayOfWeekIndex.get()) - 1
        // console.log("wwww", weekOfMonth)
        return getInterpolate({
          0: -perHeight * weekOfMonth,
          [moveHeight]: 0
        }, extrapolationClamp)
      })
      const interpolateH = memoFun(() => {
        const perHeight = perSize()
        //展示月份
        const moveHeight = calendarOpenHeight()
        return getInterpolate({
          0: perHeight,
          [moveHeight]: perHeight * 6
        }, extrapolationClamp)
      })
      fdom.div({
        className: 'overflow-hidden bg-base-200 relative',
        s_height() {
          const y = calendarScrollY()
          return interpolateH(y) + 'px'
        },
        children() {

          renderIf(showCalendar, function () {
            fdom.div({
              s_height() {
                return perSize() * 7 + 'px'
              },
              s_transform() {
                const ty = Math.max(calendarScrollY(), 0)
                return `translateY(${interpolateY(ty)}px)`
              },
              children() {
                for (let y = 0; y < 6; y++) {
                  fdom.div({
                    className: 'flex items-center justify-center relative',
                    children() {
                      for (let x = 0; x < 7; x++) {
                        const fullday = yearMonth.fullDayOf(x, y)
                        let c = yearMonth
                        if (fullday.type == 'last') {
                          c = yearMonth.lastMonth()
                        } else if (fullday.type == 'next') {
                          c = yearMonth.nextMonth()
                        }
                        renderFirstDayWeek(x, {
                          year: c.year,
                          month: c.month,
                          day: fullday.day
                        })
                        const sd = SolarDay.fromYmd(c.year, c.month, fullday.day)
                        const lunarDay = sd.getLunarDay()
                        const selected = memo(() => {
                          return fullday.type == 'this' && selectCurrent() && date.get().day == fullday.day
                        })

                        renderCell({
                          day: fullday.day,
                          onClick() {
                            date.set(
                              YearMonthDayVirtualView.from(c.year, c.month, fullday.day)
                            )
                          },
                          lunarDay,
                          selected,
                          hide() {
                            if (showCalendar()) {
                              return fullday.type != 'this'
                            }
                            return false
                          }
                        })
                      }
                    }
                  })
                }
              }
            })
          })
        }
      })

    }
  })
}