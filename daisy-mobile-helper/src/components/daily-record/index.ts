import { fdom } from "mve-dom";
import { createSignal, simpleEqualsNotEqual, YearMonthDayVirtualView, DAYMILLSECONDS, ClampingScrollFactory, dragSnapWithList } from "wy-helper";
import renderHeader from "./renderHeader";
import renderPageList from "./renderPageList";
import { topContext } from "./context";
import renderScrollYear from "./renderYearMonthChoose";
import { hookDestroy } from "mve-helper";
import { OnScroll } from "mve-dom-helper";
export function dailyRecord(arg: {
  getFullWidth(): number
  renderHeaderRight(): void
  renderContent(w: YearMonthDayVirtualView): void
}) {
  const now = YearMonthDayVirtualView.fromDate(new Date())
  const today = createSignal(now, simpleEqualsNotEqual)
  const interval = setInterval(() => {
    today.set(YearMonthDayVirtualView.fromDate(new Date()))
  }, DAYMILLSECONDS / 2)
  hookDestroy(() => {
    clearInterval(interval)
  })
  const date = createSignal(now, simpleEqualsNotEqual)

  //展示日历
  // const showCalendar = createSignal(false)

  function calendarOpenHeight() {
    return 5 * arg.getFullWidth() / 7
    // return 6 * getFullWidth() / 7
  }
  function scrollYearMonthOpenHeight() {
    return 44 * 3
    // return 3 * getFullWidth() / 7
  }
  //日历滚动,只用这个表达开关
  const calendarScrollY = new OnScroll('y', {
    init: calendarOpenHeight(),
    maxScroll: calendarOpenHeight,
    targetSnap: dragSnapWithList([
      {
        beforeForce: 1,
        size: calendarOpenHeight(),
        afterForce: 1
      }
    ])
  })

  //年月picker的滚动,默认滚动到最大
  const yearMonthScrollY = new OnScroll('y', {
    init: scrollYearMonthOpenHeight(),
    maxScroll: scrollYearMonthOpenHeight,
    targetSnap: dragSnapWithList([
      {
        beforeForce: 1,
        size: scrollYearMonthOpenHeight(),
        afterForce: 1
      }
    ])
  })

  yearMonthScrollY.maxNextScroll = calendarScrollY
  calendarScrollY.minNextScroll = yearMonthScrollY
  // animateSignal(scrollYearMonthOpenHeight())

  function showYearMonth() {
    return yearMonthScrollY.get() != scrollYearMonthOpenHeight()
  }
  topContext.provide({
    renderContent: arg.renderContent,
    renderHeaderRight: arg.renderHeaderRight,
    yearMonthScrollY,
    showYearMonth,
    scrollYearMonthOpenHeight,
    calendarScrollY,
    calendarOpenHeight,
    today: today.get,
    showCalendar() {
      return calendarScrollY.get() != calendarOpenHeight()
    },
    async calendarClose() {
      if (showYearMonth()) {
        yearMonthScrollY.animateTo(scrollYearMonthOpenHeight())
        calendarScrollY.animateTo(calendarOpenHeight())
      } else {
        calendarScrollY.animateTo(calendarOpenHeight())
      }
    },
  })
  fdom.div({
    className: 'absolute overflow-hidden inset-0 flex flex-col select-none touch-none',
    children() {
      renderScrollYear(date)
      renderHeader(date, arg.getFullWidth)
      renderPageList(date)
    }
  })
}
