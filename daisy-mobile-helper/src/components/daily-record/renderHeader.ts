import { fdom } from "mve-dom";
import { memo, numberIntFillWithN0, simpleEqualsEqual, tw, YearMonthDayVirtualView, YearMonthVirtualView, WeekVirtualView, StoreRef, GetValue, dateFromYearMonthDay, emptyArray, emptyObject, Compare } from "wy-helper";
import { getExitAnimateArray, hookTrackSignal, memoArray, renderArray, renderIf } from "mve-helper";
import { animateSignal, cns } from "wy-dom-helper";
import { hookTrackLayout } from "../hookTrackLayout";
import { firstDayOfWeekIndex, WEEKTIMES } from "../firstDayOfWeek";
import renderCalendar from "./renderCalendar";
import { topContext } from "./context";
import { IoReturnUpBackOutline } from "mve-icons/io5";
import { movePage } from "mve-dom-helper";
import { animate } from "motion";
import renderWeekday from "./renderWeekday";
import { selectShadowCell } from "./renderCell";

export default function (
  date: StoreRef<YearMonthDayVirtualView>,
  getFullWidth: GetValue<number>
) {
  const { showYearMonth, yearMonthScrollY, calendarScrollY, calendarClose, showCalendar, today, renderHeaderRight } = topContext.consume()
  hookTrackLayout(date.get, selectShadowCell)
  const yearMonth = memo<YearMonthVirtualView>((m) => {
    const d = date.get()
    return new YearMonthVirtualView(d.year, d.month, firstDayOfWeekIndex.get())
  })
  const week = memo(() => {
    const d = date.get()
    return WeekVirtualView.from(d.year, d.month, d.day, firstDayOfWeekIndex.get())
  })
  //顶部固定区域
  fdom.div({
    className: "relative",
    onPointerDown(e) {
      if (calendarScrollY.onAnimation()) {
        return
      }
      if (showYearMonth()) {
        yearMonthScrollY.pointerEventListner(e)
      } else {
        calendarScrollY.pointerEventListner(e)
      }
    },
    children() {
      //星期与天都需要滚动
      const scrollX = animateSignal(0)
      const mp = movePage(scrollX, getContainerWidth)
      mp.hookCompare(week, function (a, b) {
        if (showCalendar()) {
          return 0
        }
        return a.cells[0].toNumber() - b.cells[0].toNumber()
      })
      mp.hookCompare(yearMonth, function (ym, oldMonth) {
        if (!showCalendar()) {
          return 0
        }
        return ym.toNumber() - oldMonth.toNumber()
      })
      function getContainerWidth() {
        return container.clientWidth
      }
      const container = fdom.div({
        className: 'overflow-hidden  bg-base-300 touch-none',
        onPointerDown: mp.getOnPointerDown({
          direction: "x",
          callback(direction, velocity) {
            if (showCalendar()) {
              //切换月份
              const c = direction < 0 ? yearMonth().lastMonth() : yearMonth().nextMonth()
              if (date.get().day > c.days) {
                date.set(YearMonthDayVirtualView.from(c.year, c.month, c.days))
              } else {
                date.set(YearMonthDayVirtualView.from(c.year, c.month, date.get().day))
              }
            } else {
              //切换周
              const m = dateFromYearMonthDay(date.get())
              m.setTime(m.getTime() + direction * WEEKTIMES)
              if (direction) {
                date.set(YearMonthDayVirtualView.fromDate(m))
              }
            }
          },
        }),
        children() {
          //滚动区域
          fdom.div({
            className: 'relative',
            s_transform() {
              return `translateX(${-scrollX.get()}px)`
            },
            children() {
              renderIf(showCalendar, function () {

                renderArray(memoArray(() => {
                  const ym = yearMonth()
                  return [ym.lastMonth(), ym, ym.nextMonth()]
                }, simpleEqualsEqual as Compare<YearMonthVirtualView>), function (yearMonth, getIndex) {
                  renderCalendar(
                    yearMonth,
                    getIndex,
                    calendarScrollY,
                    date,
                    getFullWidth)
                })
              }, function () {
                renderArray(memoArray(() => {
                  const wk = week()
                  return [wk.beforeWeek(), wk, wk.nextWeek()]
                }, simpleEqualsEqual as Compare<WeekVirtualView>), function (week, getIndex) {
                  renderWeekday(week, getIndex, date)
                })
              })
            }
          })
        }
      })

      //这个是固定的
      fdom.div({
        className: 'w-full h-11 flex justify-between items-center [padding-inline:18px] bg-base-100 z-10',
        children() {
          fdom.div({
            className: 'flex items-center gap-1',

            children() {
              const getArray = getExitAnimateArray(() => {
                const tn = today().toNumber()
                const dn = date.get().toNumber()
                if (tn != dn) {
                  return [1]
                }
                return emptyArray as []
              })
              renderArray(getArray, function (m) {
                const div = fdom.button({
                  className: "daisy-btn daisy-btn-xs daisy-btn-circle",
                  onClick() {
                    date.set(today())
                  },
                  children() {
                    IoReturnUpBackOutline()
                  }
                })

                hookTrackSignal<{
                  step: "exiting" | "will-exiting" | "enter",
                  dir: number
                }>((cache = emptyObject as any) => {
                  const step = m.step()
                  const tn = today().toNumber()
                  const dn = date.get().toNumber()
                  const dir = Math.sign(dn - tn)

                  if (step == cache.step && dir == cache.dir) {
                    return cache
                  }
                  return {
                    step,
                    dir
                  }
                }, function ({ step, dir }) {
                  if (step == 'enter') {
                    animate(div, {
                      rotateY: dir > 0 ? [90, 0] : [90, 180],
                      // scaleY: [0, 1]
                    }).then(m.resolve)
                  } else if (step == 'exiting') {
                    animate(div, {
                      rotateY: dir > 0 ? [0, 90] : [180, 90],
                      // scaleY: [1, 0]
                    }).then(m.resolve)
                  }
                })
              })
              fdom.h1({
                className() {
                  const tn = today()
                  const dn = date.get()
                  return cns(
                    'text-2xl text-base-content font-bold',
                    tn.equals(dn) ? 'text-2xl' : tn.year == dn.year ? 'text-xl' : 'text-lg',

                    calendarScrollY.onAnimation() ? tw`cursor-not-allowed` : tw`cursor-pointer`
                  )
                },
                childrenType: 'text',
                children() {
                  const d = date.get()
                  if (today().year != d.year) {
                    return `${d.year}-${numberIntFillWithN0(d.month, 2)}-${numberIntFillWithN0(d.day, 2)}`
                  }
                  return `${numberIntFillWithN0(d.month, 2)}-${numberIntFillWithN0(d.day, 2)}`
                },
                onClick() {
                  if (calendarScrollY.onAnimation()) {
                    return
                  }
                  if (showCalendar()) {
                    //为了使越界触发
                    calendarClose()
                  } else {
                    calendarScrollY.animateTo(0)
                  }
                }
              })
            }
          })

          renderHeaderRight()
          // fdom.div({
          //   className: 'text-base-content',
          //   children() {
          //     fdom.span({
          //       className: 'mr-[0.125em] text-2xl',
          //       childrenType: 'text',
          //       children: '¥'
          //     })
          //     fdom.span({
          //       className: 'text-2xl',
          //       childrenType: 'text',
          //       children: '23'
          //     })
          //     fdom.sup({
          //       className: 'opacity-50 text-[0.75em] -top-[0.75em]',
          //       childrenType: 'text',
          //       children: '.00'
          //     })
          //   }
          // })
        }
      })
    }
  })

}