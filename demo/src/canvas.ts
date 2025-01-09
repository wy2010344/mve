import { dom } from "mve-dom";
import { hookDraw, PathResult, renderCanvas } from "mve-dom-helper";
import { renderArray } from "mve-helper";
import { createSignal, PointKey, quote } from "wy-helper";
/**
 * 
 * 绘制flex,在内部的hookDraw,需要使用context来封装
 * 
 */
export default function () {


  dom.div({
    className: "w-full h-[100vh] flex flex-col items-center justify-center"
  }).render(() => {

    const canvas = dom.canvas({
      width: 500,
      height: 500,
      className: "border-solid border-[1px] border-red-300"
    }).render()
    const list = createSignal<number[]>([])
    const count = createSignal(0)
    dom.button({
      onClick() {
        list.set(list.get().concat(Date.now()))
        count.set(count.get() + 1)
      }
    }).renderText`列表数量${() => list.get().length}`

    function colorRectPath(strokeStyle = "blue", clip?: boolean) {
      return function rectPath(): PathResult {
        const path = new Path2D()
        path.rect(0, 30, 100, 100)
        const rs: PathResult = {
          path,
          operates: [
            {
              type: "stroke",
              width: 10,
              style: strokeStyle
            },
            {
              type: "fill",
              style: "green"
            }
          ],
          afterClipOperates: []
        }
        if (clip) {
          rs.afterClipOperates?.push({
            type: "stroke",
            width: 30,
            style: "black"
          })
        }
        return rs
      }
    }
    renderCanvas(canvas, () => {

      hookDraw({
        x: 100,
        y: 100,
        draw: colorRectPath(),
        // draw(ctx, x, y) {
        //   const p = new Path2D()
        //   drawRoundedRect(p, {
        //     x,
        //     y,
        //     width: 100,
        //     height: 200,
        //     tl: 20,
        //     tr: 20,
        //     bl: 20,
        //     br: 20
        //   })
        //   ctx.strokeStyle = 'black'
        //   ctx.lineWidth = 1
        //   ctx.stroke(p)
        // },
        children() {
          hookDraw({
            x: 10,
            y: 10,
            draw: colorRectPath(),
          })
          hookDraw({
            x: 40,
            y: 40,
            draw: colorRectPath("yellow", true),
            children() {
              hookDraw({
                x: 0,
                y: 10,
                draw: colorRectPath('orange'),
              })


              hookDraw({
                x: 0,
                y: 30,
                draw: colorRectPath('yellow'),
              })
            }
          })
          renderArray(list.get, (row, getIndex) => {
            hookDraw({
              x() {
                return getIndex() * 20 + 100
              },
              y() {
                return getIndex() * 20 + 100
              },
              draw: colorRectPath('red'),
              onClick(e) {
                console.log("a", e, row)
                return true
              },
            })
          })
        },
      })
    })
  })
}


type SizeKey = "width" | "height"

type Info = SizeKey | PointKey

function directionToSize(x: PointKey): SizeKey {
  if (x == 'x') {
    return "width"
  } else {
    return "height"
  }
}
function oppositeDirection(x: PointKey): PointKey {
  if (x == 'x') {
    return 'y'
  } else {
    return 'x'
  }
}
function oppositeSize(x: SizeKey): SizeKey {
  if (x == 'width') {
    return 'height'
  } else {
    return 'width'
  }
}


type PaddingInfo = {
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
}
function getPadding(n: PointKey, x: PaddingInfo) {
  if (n == 'x') {
    return (x.paddingLeft!) + (x.paddingRight!)
  } else {
    return (x.paddingTop!) + (x.paddingBottom!)
  }
}
function gatPaddingStart(n: PointKey, x: PaddingInfo) {
  if (n == 'x') {
    return x.paddingLeft!
  } else {
    return x.paddingTop!
  }
}