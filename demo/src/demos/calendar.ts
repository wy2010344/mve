import { fdom, FDomAttributes } from "mve-dom";
import { renderIf } from "mve-helper";
import { LunarDay, SolarDay } from "tyme4ts";
import { signalAnimateFrame, subscribeEventListener } from "wy-dom-helper";
import { batchSignalEnd, cacheVelocity, createSignal, easeFns, getSpringBaseAnimationConfig, getTweenAnimationConfig, GetValue, memo, MomentumIScroll, MonthFullDay, startScroll, StoreRef, tw, ValueOrGet, WeekVirtualView, YearMonthVirtualView } from "wy-helper";



const WEEKS = ["一", "二", "三", "四", "五", "六", "日"]
const DAYTIMES = 24 * 60 * 60 * 1000
const WEEKTIMES = 7 * DAYTIMES
type DateModel = {
  year: number
  month: number
  day: number
}
function createYM() {
  const d = new Date()
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate()
  }
}
export default function () {
  const date = createSignal(createYM())
  const yearMonth = memo(() => {
    const d = date.get()
    return new YearMonthVirtualView(d.year, d.month, 0)
  })
  const week = memo(() => {
    const d = date.get()
    return WeekVirtualView.from(d.year, d.month, d.day, 0)
  })
  const transY = signalAnimateFrame(0)
  let content: HTMLElement

  const bs = MomentumIScroll.get()
  const container = fdom.div({
    s_height: '100vh',
    onTouchMove(e) {
      e.preventDefault()
    },
    onPointerDown(e) {
      const m = startScroll(e.pageY, {
        containerSize() {
          return container.clientHeight
        },
        contentSize() {
          return content.offsetHeight
        },
        getCurrentValue() {
          return transY.get()
        },
        changeTo(value) {
          transY.changeTo(value)
        },
        finish(v) {
          const out = bs.destinationWithMargin(v)
          if (out.type == "scroll") {
            transY.changeTo(out.target, getTweenAnimationConfig(out.duration, easeFns.out(easeFns.circ)))
          } else if (out.type == "scroll-edge") {
            transY.changeTo(out.target, getTweenAnimationConfig(out.duration, easeFns.out(easeFns.circ)), {
              onFinish(v) {
                transY.changeTo(out.finalPosition, getTweenAnimationConfig(300, easeFns.out(easeFns.circ)))
              },
            })
          } else if (out.type == "edge-back") {
            transY.changeTo(out.target, getTweenAnimationConfig(300, easeFns.out(easeFns.circ)), {
              onFinish(v) {
                console.log("va", transY.get())
              },
            })
          }
        },
      })
      const destroyMove = subscribeEventListener(document, 'pointermove', e => {
        m.move(e.pageY)
      })
      const destroyEnd = subscribeEventListener(document, 'pointerup', e => {
        m.end(e.pageY)
        destroyMove()
        destroyEnd()
      })
    },
    children() {
      content = fdom.div({
        s_transform() {
          return `translateY(${transY.get()}px)`
        },
        // 至少要折叠到星期
        s_minHeight: `calc(100% + 500vw / 7)`,
        children() {
          //header
          fdom.div({
            children() {

            }
          })

          //星期
          fdom.div({
            s_display: 'flex',
            s_alignItems: 'center',
            s_justifyContent: 'space-between',
            s_transform() {
              const ty = Math.min(transY.get(), 0)
              return `translateY(${-ty}px)`
            },
            children() {
              for (let i = 0; i < 7; i++) {
                fdom.div({
                  s_flex: 1,
                  s_aspectRatio: 1,
                  s_display: 'flex',
                  s_alignItems: 'center',
                  s_justifyContent: 'center',
                  childrenType: "text",
                  children() {
                    return WEEKS[yearMonth().weekDay(i)]
                  }
                })
              }
            }
          })

          const showWeek = createSignal(false)


          const transX = signalAnimateFrame(0)


          function toggleCalendar(c: YearMonthVirtualView) {
            if (date.get().day > c.days) {
              date.set({
                year: c.year,
                month: c.month,
                day: c.days
              })
            } else {
              date.set({
                year: c.year,
                month: c.month,
                day: date.get().day
              })
            }
          }
          /**
           * 
           * @param direction 1向左,-1向右
           * @param velocity 
           */
          function updateDirection(direction: number, velocity = 0) {
            if (direction) {
              const diffWidth = direction * container.clientWidth
              transX.animateTo(
                -diffWidth,
                getSpringBaseAnimationConfig({
                  initialVelocity: velocity
                }))
              transX.slientDiff(diffWidth)
            } else {
              transX.animateTo(0, getSpringBaseAnimationConfig({
                initialVelocity: velocity
              }))
            }
          }
          function updateDirectionScroll(direction: number) {
            if (showWeek.get()) {

            } else {
              if (direction < 0) {
                toggleCalendar(yearMonth().lastMonth())
              } else if (direction > 0) {
                toggleCalendar(yearMonth().nextMonth())
              }
            }
          }
          const container = fdom.div({
            s_position: 'relative',
            onPointerDown(e) {
              const velocityX = cacheVelocity()
              velocityX.append(e.timeStamp, e.pageX)
              let lastPageX = e.pageX
              const destroyMove = subscribeEventListener(document, 'pointermove', e => {
                velocityX.append(e.timeStamp, e.pageX)
                transX.changeTo(e.pageX - lastPageX + transX.get())
                lastPageX = e.pageX
              })
              const destroyEnd = subscribeEventListener(document, 'pointerup', e => {
                // velocityX.append(e.timeStamp, e.pageX)
                transX.changeTo(e.pageX - lastPageX + transX.get())
                const dis = bs.getWithSpeedIdeal(velocityX.get())
                const targetDis = dis.distance + transX.get()
                const absTargetDis = Math.abs(targetDis)
                if (absTargetDis < container.clientWidth / 2) {
                  //恢复原状
                  updateDirection(0, velocityX.get())
                } else {
                  const direction = targetDis < 0 ? 1 : -1
                  updateDirectionScroll(direction)
                  updateDirection(direction, velocityX.get())
                  batchSignalEnd()
                }
                destroyMove()
                destroyEnd()
              })
            },
            s_transform() {
              return `translateX(${transX.get()}px)`
            },
            children() {
              function setCalenderData(fd: MonthFullDay) {
                let c: YearMonthVirtualView = yearMonth()
                let dir = 0
                if (fd.type == 'last') {
                  c = yearMonth().lastMonth()
                  dir = -1
                } else if (fd.type == 'next') {
                  c = yearMonth().nextMonth()
                  dir = 1
                }
                date.set({
                  year: c.year,
                  month: c.month,
                  day: fd.day
                })
                updateDirection(dir, 0)
              }

              //前一部分
              renderIf(showWeek.get, () => {

              }, () => {
                //显示月份
                renderCalendarView(
                  () => yearMonth().lastMonth(), date, setCalenderData, 0)
              })

              //中间部分

              renderCalendarView(yearMonth, date, setCalenderData, 1)

              //后面部分
              //前一部分
              renderIf(showWeek.get, () => {

              }, () => {
                //显示月份
                renderCalendarView(() => yearMonth().nextMonth(), date, setCalenderData, 2)
              })
            }
          })
        }
      })
    }
  })
}

function renderCalendarView(
  yearMonth: GetValue<YearMonthVirtualView>,
  date: StoreRef<DateModel>,
  setCalenderData: (v: MonthFullDay) => void,
  i: number
) {
  function selectCurrent() {
    const d = date.get()
    const ym = yearMonth()
    return d.year == ym.year && d.month == ym.month
  }
  const arg: FDomAttributes<"div"> = {}
  if (i != 1) {
    arg.s_position = 'absolute'
    arg.s_inset = 0
    arg.s_transform = `translateX(${(i - 1) * 100}%)`
  }
  arg.children = () => {
    for (let y = 0; y < 6; y++) {
      fdom.div({
        s_display: 'flex',
        s_alignItems: 'center',
        s_justifyContent: 'center',
        children() {
          for (let x = 0; x < 7; x++) {

            const fullday = memo(() => yearMonth().fullDayOf(x, y))
            const lunarDay = memo(() => {
              let c = yearMonth()
              const fd = fullday()
              if (fd.type == 'last') {
                c = yearMonth().lastMonth()
              } else if (fd.type == 'next') {
                c = yearMonth().nextMonth()
              }
              const sd = SolarDay.fromYmd(c.year, c.month, fd.day)
              return sd.getLunarDay()
            })
            const selected = memo(() => {
              return fullday().type == 'this' && selectCurrent() && date.get().day == fullday().day
            })

            renderCell({
              day() {
                return fullday().day
              },
              onClick() {
                setCalenderData(fullday())
              },
              lunarDay,
              selected,
              hide() {
                return fullday().type != 'this'
              }
            })
          }
        }
      })
    }
  }
  return fdom.div(arg)
}

function renderWeek(
  week: GetValue<WeekVirtualView>,
  date: StoreRef<DateModel>,
  i: number
) {

}

function renderCell({
  day,
  lunarDay,
  hide,
  selected,
  onClick
}: {
  day: ValueOrGet<number>
  hide: GetValue<boolean>
  lunarDay: GetValue<LunarDay>,
  selected: GetValue<boolean>
  onClick(): void
}) {
  fdom.div({
    s_flex: 1,
    s_aspectRatio: 1,
    s_display: 'flex',
    s_flexDirection: 'column',
    s_alignItems: 'center',
    s_justifyContent: 'center',
    className() {
      return hide() ? tw`text-gray-400 opacity-80` : ''
    },
    onClick,
    children() {
      fdom.div({
        s_aspectRatio: 1,
        s_display: 'grid',
        s_placeItems: 'center',
        childrenType: 'text',
        className() {
          return selected() ? tw`text-white rounded-full bg-green-400` : '';
        },
        children: day
      })

      fdom.div({
        s_fontSize: '10px',
        childrenType: 'text',
        children() {
          return lunarDay().getName()
        }
      })
    }
  })
}