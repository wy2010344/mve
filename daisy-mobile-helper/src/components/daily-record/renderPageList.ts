import { fdom } from "mve-dom";
import { dateFromYearMonthDay, DAYMILLSECONDS, simpleEqualsEqual, YearMonthDayVirtualView, StoreRef, Compare } from "wy-helper";
import { memoArray, renderArray, renderArrayKey } from "mve-helper";
import { animateSignal, } from "wy-dom-helper";
import renderPage from "./renderPage";
import { movePage, createSimpleMovePage } from "mve-dom-helper";

export default function (
  date: StoreRef<YearMonthDayVirtualView>
) {
  const mp = createSimpleMovePage({
    getValue: date.get,
    direction: 'x',
    compare(d, lastDate) {

      const lastTime = dateFromYearMonthDay(lastDate).valueOf()
      const thisTime = dateFromYearMonthDay(d).valueOf()
      const diff = thisTime - lastTime
      let direction = 0
      if (diff >= DAYMILLSECONDS) {
        direction = 1
      } else if (diff <= -DAYMILLSECONDS) {
        direction = -1
      }
      return direction
    },
    callback(direction, velocity) {
      const m = dateFromYearMonthDay(date.get())
      m.setTime(m.getTime() + direction * DAYMILLSECONDS)
      if (direction) {
        date.set(YearMonthDayVirtualView.fromDate(m))
      }
    },
  })
  fdom.div({
    className: 'flex-1 overflow-hidden',
    plugins: [
      mp.plugin
    ],
    children() {
      fdom.div({
        className: 'h-full',
        s_transform() {
          return `translateX(${-mp.get()}px)`
        },
        children() {
          renderArrayKey(() => {
            const d = date.get()
            return [
              d.beforeDay(),
              d,
              d.nextDay()
            ]
          }, v => v.toNumber(), function (w, getIndex) {
            renderPage(w(), getIndex, () => {
              return mp.onAnimation()
            })
          })
        }
      })
    }
  })
}