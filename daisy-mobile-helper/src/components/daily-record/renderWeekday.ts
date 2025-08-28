import { fdom, mdom } from "mve-dom"
import { dateFromYearMonthDay, GetValue, getWeekOfYear, StoreRef, WeekVirtualView, YearMonthDay, yearMonthDayEqual, YearMonthDayVirtualView } from "wy-helper"
import { firstDayOfWeekIndex, WEEKS } from "../p"
import { SolarDay } from "tyme4ts"
import renderCell from "./renderCell"


export function renderWeekHeader(renderCell: (i: number) => string) {
  fdom.div({
    className: 'flex bg-base-100 z-10 relative',
    children() {
      for (let i = 0; i < 7; i++) {
        fdom.div({
          className: 'flex-1 aspect-square flex items-center justify-center text-base-content',
          childrenType: "text",
          children() {
            return renderCell(i)
          }
        })
      }
    }
  })
}


export function renderFirstDayWeek(x: number, ym: YearMonthDay) {
  if (x == 0) {
    fdom.div({
      className: 'absolute left-0 text-label-small',
      childrenType: 'text',
      children() {
        return getWeekOfYear(dateFromYearMonthDay(ym), firstDayOfWeekIndex.get())
      }
    })
  }
}




export default function (
  week: WeekVirtualView,
  getIndex: GetValue<number>,
  date: StoreRef<YearMonthDayVirtualView>
) {
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
        return WEEKS[week.weekDay(i)]
      })
      fdom.div({
        className: 'flex items-center justify-center relative',
        children() {
          for (let x = 0; x < 7; x++) {
            const md = week.cells[x]
            renderFirstDayWeek(x, md)

            const sd = SolarDay.fromYmd(md.year, md.month, md.day)
            const lunarDay = sd.getLunarDay()
            renderCell({
              hide() {
                return false;
              },
              day: md.day,
              lunarDay,
              selected() {
                return yearMonthDayEqual(md, date.get())
              },
              onClick() {
                date.set(md)
              },
            })
          }
        }
      })
    }
  })

}