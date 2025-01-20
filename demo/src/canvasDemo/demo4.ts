import { addEffect, createSignal, flexDisplayUtil, memo } from "wy-helper";
import data from "./data";
import { AbsoluteNode, hookDrawRect, simpleFlex, hookDrawText, hookDrawUrlImage } from "mve-dom-helper";

import Scroller from 'scroller';
import { hookTrackSignal } from "mve-helper";
export default function () {


  let moveLastPoint: PointerEvent | undefined

  const scrollTop = createSignal(0)
  const scroller = new Scroller((left: number, top: number) => {
    scrollTop.set(top)
  }, {
    scrollingX: false,
    scrollingY: true,
    decelerationRate: 0.95,
    penetrationAcceleration: 0.08,
  })
  window.addEventListener("pointermove", e => {
    if (moveLastPoint) {
      // console.log("move", moveLastPoint)
      moveLastPoint = e
      scroller.doTouchMove([moveLastPoint], moveLastPoint.timeStamp);
    }
  })

  function end(e: PointerEvent) {
    if (moveLastPoint) {
      // console.log("end", moveLastPoint)
      moveLastPoint = undefined
      scroller.doTouchEnd(e.timeStamp);
    }
  }
  window.addEventListener("pointerup", end)
  window.addEventListener("pointercancel", end)

  hookTrackSignal(() => {
    addEffect(() => {
      scroller.setDimensions(420, 700, 420, (80 + 30) * data.length - 30);
    })
  })
  hookDrawRect({
    width: 420,
    height: 700,
    paddingTop() {
      return -scrollTop.get()
    },
    layout() {
      return simpleFlex({
        gap: 30
      })
    },
    draw(ctx, n) {
      const path = new Path2D()
      path.rect(0, 0, n.width(), n.height())
      return {
        path,
        operates: [
          {
            type: "fill",
            style: 'yellow'
          }
        ],
        clipFillRule: "nonzero"
      }
    },
    onPointerDown(e) {
      moveLastPoint = e.original
      scroller.doTouchStart([moveLastPoint], moveLastPoint.timeStamp);
    },
    children() {
      data.forEach((row, i) => {
        hookDrawRect({
          height: 80,
          width: 700,
          layout(v) {
            return simpleFlex({
              direction: "x",
              gap: 4
            })
          },
          children() {
            hookDrawRect({
              width: 80,
              height: 80,
              layout(v) {
                return simpleFlex({
                  direction: "x"
                })
              },
              draw(ctx, n) {
                const path = new Path2D()
                path.rect(0, 0, n.width(), n.height())
                return {
                  path,
                  clipFillRule: "nonzero"
                }
              },
              children() {
                hookDrawUrlImage({
                  ext: {
                    grow: 9
                  },
                  relay: "width",
                  src: row.imageUrl,
                })
              },
            })
            hookDrawText({
              ext: {
                grow: 1
              },
              config: {
                maxLines: 3,
                text: row.title,
                lineHeight: 20
              },
              drawInfo: {
                style: "",
              }
            })
          },
        })
      })
    },
  })

}