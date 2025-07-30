import { dom } from "mve-dom";
import { hookDraw, PathResult, renderCanvas } from "mve-dom-helper/canvasRender";
import { renderArray } from "mve-helper";
import { createSignal } from "wy-helper";

export default function () {
  const list = createSignal<number[]>([])
  const count = createSignal(0)
  dom.button({
    onClick() {
      list.set(list.get().concat(Date.now()))
      count.set(count.get() + 1)
    }
  }).renderText`列表数量${() => list.get().length}`
  renderCanvas({
    width: 500,
    height: 500,
    className: "border-solid border-[1px] border-red-300"
  }, function () {
    hookDraw({
      x: 100,
      y: 100,
      draw: colorRectPath(),
      withPath: true,
      children() {
        hookDraw({
          x: 10,
          y: 10,
          withPath: true,
          draw: colorRectPath(),
        })
        hookDraw({
          x: 40,
          y: 40,
          withPath: true,
          draw: colorRectPath("yellow", true),
          children() {
            hookDraw({
              x: 0,
              withPath: true,
              y: 10,
              draw: colorRectPath('orange'),
            })


            hookDraw({
              x: 0,
              y: 30,
              withPath: true,
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
            withPath: true,
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
}
function colorRectPath(strokeStyle = "blue", clip?: boolean) {
  return function rectPath(ctx: any, path: Path2D): PathResult {
    path.rect(0, 30, 100, 100)
    const rs: PathResult = {
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