import { hookRect } from "mve-dom-helper"

export default function () {


  hookRect({
    x: 100,
    y: 100,
    draw(ctx) {

      const path = new Path2D()
      path.rect(0, 0, 300, 300)

      return {
        path,
        operates: [
          { type: "stroke", width: 10, style: "green" },
        ],
        clipFillRule: "nonzero"
      }
    },
    beforeChildren() {
      hookRect({
        x: -30,
        y: -30,
        onPointerDown(e) {
          console.log("before-click", e)
        },
        draw(ctx) {

          const path = new Path2D()
          path.rect(0, 0, 300, 300)

          return {
            path,
            operates: [
              { type: "stroke", width: 10, style: "yellow" },
            ]
          }
        },
      })
    },
    children() {
      hookRect({
        x: -30,
        y: -30,
        onPointerDown(e) {
          console.log("click", e)
        },
        draw(ctx) {

          const path = new Path2D()
          path.rect(0, 0, 300, 300)

          return {
            path,
            operates: [
              { type: "stroke", width: 10, style: "blue" },
            ]
          }
        },
      })
    },
  })
}


type InstanceCallbackOrValue<T> = T | ((n: AbsoluteNode) => T)

interface AbsoluteNode {
  x?: InstanceCallbackOrValue<number>
  y?: InstanceCallbackOrValue<number>
  width?: InstanceCallbackOrValue<number>
  height?: InstanceCallbackOrValue<number>
}