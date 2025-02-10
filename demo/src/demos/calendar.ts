import { fdom, FDomAttributes } from "mve-dom";
import { renderIf } from "mve-helper";
import { LunarDay, SolarDay } from "tyme4ts";
import { signalAnimateFrame, subscribeEventListener } from "wy-dom-helper";
import { batchSignalEnd, cacheVelocity, createSignal, dateFromYearMonthDay, DAYMILLSECONDS, easeFns, emptyFun, extrapolationClamp, getInterpolate, getSpringBaseAnimationConfig, getTweenAnimationConfig, GetValue, getWeekOfMonth, memo, MomentumIScroll, MonthFullDay, PagePoint, run, SignalAnimateFrameValue, startScroll, StoreRef, tw, ValueOrGet, WeekVirtualView, yearMonthDayEqual, YearMonthVirtualView } from "wy-helper";



const WEEKS = ["一", "二", "三", "四", "五", "六", "日"]
const WEEKTIMES = 7 * DAYMILLSECONDS
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
  const showWeek = createSignal(false)
  const transX = signalAnimateFrame(0)

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
      const m = dateFromYearMonthDay(date.get())
      if (direction < 0) {
        m.setTime(m.getTime() - WEEKTIMES)
      } else if (direction > 0) {
        m.setTime(m.getTime() + WEEKTIMES)
      }
      if (direction) {
        date.set({
          year: m.getFullYear(),
          month: m.getMonth() + 1,
          day: m.getDate()
        })
      }
    } else {
      if (direction < 0) {
        toggleCalendar(yearMonth().lastMonth())
      } else if (direction > 0) {
        toggleCalendar(yearMonth().nextMonth())
      }
    }
  }
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
  const container = fdom.div({
    s_height: '100vh',
    s_overflow: 'hidden',
    onTouchMove(e) {
      e.preventDefault()
    },
    onPointerDown(e) {
      const initE = e;
      const destroyJudgeMove = subscribeEventListener(document, 'pointermove', e => {
        destroyJudgeMove();
        const absY = Math.abs(e.pageY - initE.pageY)
        const absX = Math.abs(e.pageX - initE.pageX)
        if (absX > absY) {
          //左右滑动
          const velocityX = cacheVelocity()
          velocityX.append(e.timeStamp, e.pageX)
          let lastPageX = e.pageX

          function didMove(e: PointerEvent) {
            velocityX.append(e.timeStamp, e.pageX)
            transX.changeTo(e.pageX - lastPageX + transX.get())
            lastPageX = e.pageX
          }
          didMove(e)
          const destroyMove = subscribeEventListener(document, 'pointermove', didMove)
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
        } else {
          //上下滑动
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
                const perWidth = window.innerWidth / 7
                if (out.target < -perWidth * 3) {
                  //进入week模式
                  showWeek.set(true)
                  transY.changeTo(Math.min(-perWidth * 5, out.target), getTweenAnimationConfig(out.duration, easeFns.out(easeFns.circ)))
                } else {
                  showWeek.set(false)
                  transY.changeTo(0, getTweenAnimationConfig(out.duration, easeFns.out(easeFns.circ)))
                }
              } else {
                if (out.target < 0) {
                  //进入month模式
                  showWeek.set(true)
                } else {
                  //进入week模式==0
                  showWeek.set(false)
                }
                if (out.type == "scroll-edge") {
                  //到达边界外
                  transY.changeTo(out.target, getTweenAnimationConfig(out.duration, easeFns.out(easeFns.circ)), {
                    onFinish(v) {
                      transY.changeTo(out.finalPosition, getTweenAnimationConfig(300, easeFns.out(easeFns.circ)))
                    },
                  })
                } else if (out.type == "edge-back") {
                  //已经在边界外
                  transY.changeTo(out.target, getTweenAnimationConfig(300, easeFns.out(easeFns.circ)))
                }
              }
            }
          })


          m.move(e.pageY)
          const destroyMove = subscribeEventListener(document, 'pointermove', e => {
            m.move(e.pageY)
          })
          const destroyEnd = subscribeEventListener(document, 'pointerup', e => {
            m.end(e.pageY)
            destroyMove()
            destroyEnd()
          })
        }
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
            s_display: 'flex',
            s_alignItems: 'stretch',
            s_transform() {
              const ty = Math.min(transY.get(), 0)
              return `translateY(${-ty}px)`
            },
            children() {
              fdom.h1({
                childrenType: "text",
                s_fontSize: '48px',
                s_lineHeight: '48px',
                children() {
                  return date.get().month
                }
              })
              fdom.div({
                children() {
                  fdom.div({
                    childrenType: "text",
                    children() {
                      return date.get().year
                    }
                  })
                  fdom.div({
                    childrenType: "text",
                    children() {
                      return `月 ${date.get().day}日`
                    }
                  })
                }
              })
              fdom.div({
                childrenType: "text",
                children() {
                  return showWeek.get() ? '周' : '月'
                }
              })
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

          const interpolateH = run(() => {
            const perHeight = window.innerWidth / 7
            const moveHeight = perHeight * 5
            return getInterpolate({
              0: perHeight * 6,
              [-moveHeight]: perHeight
            }, extrapolationClamp)
          })
          fdom.div({
            s_overflow: 'hidden',
            s_height() {
              const y = transY.get()
              return interpolateH(y) + 'px'
            },
            s_transform() {
              const ty = Math.min(transY.get(), 0)
              return `translateY(${-ty}px)`
            },
            children() {
              fdom.div({
                s_position: 'relative',
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
                    renderWeek(() => week().beforeWeek(), date, 0)
                  }, () => {
                    //显示月份
                    renderCalendarView(
                      () => yearMonth().lastMonth(),
                      date,
                      setCalenderData,
                      transY,
                      showWeek,
                      0)
                  })

                  //中间部分

                  renderCalendarView(
                    yearMonth,
                    date,
                    setCalenderData,
                    transY,
                    showWeek,
                    1)

                  //后面部分
                  //前一部分
                  renderIf(showWeek.get, () => {
                    renderWeek(() => week().nextWeek(), date, 2)
                  }, () => {
                    //显示月份
                    renderCalendarView(
                      () => yearMonth().nextMonth(),
                      date,
                      setCalenderData, transY,
                      showWeek,
                      2)
                  })
                }
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
  transY: SignalAnimateFrameValue,
  showWeek: StoreRef<boolean>,
  i: number
) {
  function selectCurrent() {
    const d = date.get()
    const ym = yearMonth()
    return d.year == ym.year && d.month == ym.month
  }
  const arg: FDomAttributes<"div"> = {}
  if (i == 1) {
    const interpolateY = memo(() => {
      const perHeight = window.innerWidth / 7
      const moveHeight = perHeight * 5
      const weekOfMonth = getWeekOfMonth(dateFromYearMonthDay(date.get())) - 1
      return getInterpolate({
        0: 0,
        [-moveHeight]: -perHeight * weekOfMonth
      }, extrapolationClamp)
    })
    arg.s_transform = () => {
      const y = transY.get()
      return ` translateY(${interpolateY()(y)}px)`
    }
  } else {
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
                if (showWeek.get()) {
                  return false
                }
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

  const arg: FDomAttributes<"div"> = {
    s_display: 'flex',
    s_alignItems: 'center',
    s_justifyContent: 'space-between',
    s_alignSelf: 'flex-start'
  }
  if (i != 1) {
    arg.s_position = 'absolute'
    arg.s_inset = 0
    arg.s_transform = `translateX(${(i - 1) * 100}%)`
  }
  arg.children = () => {

    for (let x = 0; x < 7; x++) {
      const md = memo(() => week().cells[x])
      const lunarDay = memo(() => {
        const sd = SolarDay.fromYmd(md().year, md().month, md().day)
        return sd.getLunarDay()
      })
      renderCell({
        hide() {
          return false;
        },
        day() {
          return md().day
        },
        lunarDay,
        selected() {
          return yearMonthDayEqual(md(), date.get())
        },
        onClick() {

        },
      })
    }
  }
  fdom.div(arg)
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