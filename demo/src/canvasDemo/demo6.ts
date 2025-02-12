import { hookDraw } from "mve-dom-helper";
import { objectFreeze } from "wy-helper";

export default function () {


  const path = new Path2D()
  hookDraw({
    x: 10,
    y: 10,
    onClick(e) {
      console.log("1")
    },
    draw(ctx) {
      // path.rect(0, 0, 20, 20)
      path.closePath()
      objectFreeze(path)
      path.roundRect(0, 0, 30, 30, [10, 20, 30, 40])
      return {
        path,
        operates: [
          {
            type: "fill",
            style: "red"
          }
        ]
      }
    },
  })

  hookDraw({
    x: 200,
    y: 200,
    onClick(e) {
      console.log("2")
    },
    draw(ctx) {
      path.rect(40, 40, 20, 20)
      //使用了translate就不能点击了
      // ctx.translate(100, 100)
      return {
        path,
        operates: [
          {
            type: "fill",
            style: "green"
          }
        ]
      }
    },
  })
}