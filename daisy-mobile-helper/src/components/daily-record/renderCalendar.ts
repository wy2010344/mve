import { renderIf } from "mve-helper";
import { fdom, mdom } from "mve-dom";
import { dateFromYearMonthDay, extrapolationClamp, getInterpolate, GetValue, getWeekOfMonth, memo, memoFun, StoreRef, YearMonthDayVirtualView, YearMonthVirtualView } from "wy-helper";
import { SolarDay } from "tyme4ts";
import { firstDayOfWeekIndex, WEEKS } from "../firstDayOfWeek";
import { topContext } from "./context";
import { renderFirstDayWeek, renderWeekHeader } from "./renderWeekday";
import renderCell from "./renderCell";
import { OnScroll } from "mve-dom-helper";
export default function (
  yearMonth: YearMonthVirtualView,
  getIndex: GetValue<number>,
  calendarScrollY: OnScroll,
  date: StoreRef<YearMonthDayVirtualView>,
  fullWidth: GetValue<number>
) {

  function perSize() {
    return fullWidth() / 7
  }
  const { showCalendar } = topContext.consume()

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
        const moveHeight = perHeight * 5
        const weekOfMonth = getWeekOfMonth(dateFromYearMonthDay(date.get()), firstDayOfWeekIndex.get()) - 1
        return getInterpolate({
          0: 0,
          [moveHeight]: perHeight * weekOfMonth
        }, extrapolationClamp)
      })
      const interpolateH = memoFun(() => {
        //展示月份
        const moveHeight = perSize() * 5
        return getInterpolate({
          0: perSize() * 6,
          [moveHeight]: perSize()
        }, extrapolationClamp)
      })
      fdom.div({
        className: 'overflow-hidden bg-base-200 relative',
        s_height() {
          const y = calendarScrollY.get()
          return interpolateH(y) + 'px'
        },
        children() {

          renderIf(showCalendar, function () {
            fdom.div({
              s_height() {
                return perSize() * 7 + 'px'
              },
              s_transform() {
                const ty = Math.max(calendarScrollY.get(), 0)
                return `translateY(${-interpolateY(ty)}px)`
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