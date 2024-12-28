import { hookDraw } from "mve-dom-helper"

export default function () {


  hookDraw({
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
      hookDraw({
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
      hookDraw({
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
