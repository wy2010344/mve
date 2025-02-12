import { faker } from "@faker-js/faker"
import { fdom } from "mve-dom"
import { renderArrayToArray } from "mve-helper"
import { moveEdgeScroll, signalAnimateFrame, subscribeEventListener, subscribeScroller } from "wy-dom-helper"
import { AbsAnimateFrameValue, arrayMove, batchSignalEnd, beforeMoveOperate, createSignal, easeFns, getTweenAnimationConfig, PointKey, reorderCheckTarget, SignalAnimateFrameValue, StoreRef } from "wy-helper"

export const dataList = Array(30).fill(1).map((_, i) => {
  return {
    index: i,
    name: faker.person.fullName(),
    avatar: faker.image.urlLoremFlickr({
      width: 50,
      height: 50,
      category: 'orchid'
    })
  }
})

type Row = typeof dataList[0]
const ease1 = getTweenAnimationConfig(600, easeFns.out(easeFns.circ))
export default function () {
  const orderList = createSignal(dataList)
  const onDrag = createSignal<Row | undefined>(undefined)
  fdom.div({
    s_overflow: 'hidden',
    s_height: '100vh',
    onTouchMove(e) {
      e.preventDefault()
    },
    children() {
      const container = fdom.div({
        s_width: '300px',
        s_height: '100%',
        s_overflow: 'auto',
        s_marginInline: 'auto',
        s_position: 'relative',
        s_userSelect() {
          return onDrag.get() ? 'none' : 'auto'
        },
        children() {
          const outArray = renderArrayToArray(orderList.get, (v, getIndex) => {
            const h = Math.floor(Math.random() * 100 + 50)
            const transY = signalAnimateFrame(0)
            const marginTop = 10//Math.floor(Math.random() * 10 + 5)
            const div = fdom.div({
              s_display: 'flex',
              s_alignItems: 'center',
              s_marginTop() {
                return getIndex() ? marginTop + 'px' : '0px'
              },
              s_border: '1px solid black',
              s_background: '#ffff003d',
              s_position: 'relative',
              s_height: h + 'px',
              s_zIndex() {
                return onDrag.get() == v ? '1' : '0'
              },
              s_transform() {
                return `translateY(${transY.get()}px)`
              },
              onPointerDown(e) {
                if (onDrag.get()) {
                  return
                }
                const destroyScroll = subscribeScroller(container, 'y', e => {
                  transY.changeTo(transY.get() + e)
                  return true
                })
                onDrag.set(v)
                let lastPageY = e.pageY
                const mes = moveEdgeScroll(e.pageY, {
                  direction: "y",
                  container,
                  config: {
                    padding: 10,
                    config: true
                  }
                })
                const endMove = subscribeEventListener(document, 'pointermove', e => {
                  mes.changePoint(e.pageY)
                  transY.changeTo(transY.get() + e.pageY - lastPageY)
                  lastPageY = e.pageY
                  const outList = outArray()
                  didMove(orderList, transY, div, getIndex(), outList, marginTop)
                  // didMoveMarginTop(orderList, transY, div, getIndex(), outList, marginTop)
                  batchSignalEnd()
                })
                const endUp = subscribeEventListener(document, 'pointerup', e => {
                  endMove()
                  endUp()
                  destroyScroll()
                  mes.destroy()
                  transY.changeTo(0, ease1, {
                    onFinish(v) {
                      onDrag.set(undefined)
                    },
                  })
                  batchSignalEnd()
                })
                batchSignalEnd()
              },
              children() {
                fdom.img({
                  a_src: v.avatar,
                })
                fdom.span({
                  childrenType: "text",
                  children: v.name
                })
                fdom.hr({
                  s_flex: 1
                })
              }
            })

            return {
              div,
              transY,
              getIndex
            }
          })
        }
      })
    }
  })

}

function getOffset(v: {
  div: {
    offsetHeight: number
  };
  transY: AbsAnimateFrameValue;
}) {
  return v.div.offsetHeight
}

function didMove<T>(
  orderList: StoreRef<T[]>,
  transY: SignalAnimateFrameValue,
  div: {
    offsetHeight: number
  },
  index: number,
  outList: {
    div: {
      offsetHeight: number
    };
    transY: AbsAnimateFrameValue;
  }[],
  gap: number = 0
) {

  const n = reorderCheckTarget(
    outList,
    index,
    getOffset,
    transY.get(),
    gap
  )
  if (n) {
    const [fromIndex, toIndex] = n
    const diff = beforeMoveOperate(fromIndex, toIndex, outList, getOffset, gap, (row, from) => {
      row.transY.changeTo(0, ease1, {
        /**
         * 如果依margin,则元素应该有margin?
         * 如果元素在位置1,则无margin与gap
         * 如果不在位置1,则有margin与gap
         */
        from
      })
    })
    orderList.set(arrayMove(orderList.get(), fromIndex, toIndex, true))
    transY.slientDiff(diff)
  }
}

function didMoveMarginTop<T>(
  orderList: StoreRef<T[]>,
  transY: SignalAnimateFrameValue,
  div: {
    offsetTop: number
    offsetHeight: number
  },
  index: number,
  outList: {
    div: {
      offsetTop: number
      offsetHeight: number
    };
    transY: AbsAnimateFrameValue;
  }[],
  marginTop: number = 0
) {

  const didCenterOffsetTop = div.offsetTop + transY.get() + (div.offsetHeight / 2)
  // console.log("dd", transY.get())
  if (transY.get() < 0) {
    //向上
    let justIndex = -1
    for (let i = 0; i < index && justIndex < 0; i++) {
      const row = outList[i]
      const rowCenter = row.div.offsetTop + (row.div.offsetHeight / 2)
      if (didCenterOffsetTop < rowCenter) {
        //第一个超过的元素
        justIndex = i
      }
    }
    if (justIndex > -1) {
      const diff = div.offsetTop - outList[justIndex].div.offsetTop
      for (let i = justIndex; i < index; i++) {
        const row = outList[i]
        // row.transY.changeTo(-div.offsetHeight - marginTop)
        row.transY.changeTo(0, ease1, {
          /**
           * 如果依margin,则元素应该有margin?
           * 如果元素在位置1,则无margin与gap
           * 如果不在位置1,则有margin与gap
           */
          from: -div.offsetHeight - marginTop
        })
      }
      console.log("aa", index, justIndex, diff, transY.get(), diff + transY.get())
      orderList.set(arrayMove(orderList.get(), index, justIndex, true))
      transY.slientDiff(diff)
    }
  } else {
    //向下
    let justIndex = -1
    for (let i = index + 1; i < outList.length && justIndex < 0; i++) {
      const row = outList[i]
      const rowCenter = row.div.offsetTop + (row.div.offsetHeight / 2)
      if (didCenterOffsetTop > rowCenter) {
        justIndex = i
      }
    }
    if (justIndex > -1) {
      const flagDiv = outList[justIndex].div
      //就是受影响的间隔
      const diff = div.offsetTop + div.offsetHeight - (flagDiv.offsetTop + flagDiv.offsetHeight)
      for (let i = index + 1; i < justIndex + 1; i++) {
        //受影响的表演一次animation动画
        const row = outList[i]
        // row.transY.changeTo(div.offsetHeight + marginTop)
        row.transY.changeTo(0, ease1, {
          from: div.offsetHeight + marginTop
        })
      }
      console.log("bb", index, justIndex)
      orderList.set(arrayMove(orderList.get(), index, justIndex, true))
      transY.slientDiff(diff)
    }
  }
}