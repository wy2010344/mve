import { memo, ValueOrGet, valueOrGetToGet } from "wy-helper"
import { AbsoluteNode, hookDrawRect, simpleFlex, hookDrawText, hookDrawUrlImage } from "mve-dom-helper";


export default function () {

  hookDrawRect({
    height: 500,
    width: 400,
    // paddingLeft: 10,
    // paddingRight: 20,
    // paddingBottom: 30,
    // paddingTop: 40,
    // width(n) {
    //   return n.getInfo('width') + 50
    // },
    // height(n) {
    //   return n.getInfo('height') + 50
    // },
    layout() {
      return simpleFlex({
        gap: 10,
        direction: 'x',
        reverse: true,
        alignItems: 'center',
        alignFix: true,
        directionFix: "around"
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
            style: "yellow"
          }
        ]
      }
    },
    children() {
      hookDrawRect({
        height: 30,
        width: 20,
        // ext: {
        //   grow: 1,
        // },
        draw(ctx, n) {
          const path = new Path2D()
          path.rect(0, 0, n.width(), n.height())
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
      hookDrawRect({
        height: 30,
        width: 20,
        // ext: {
        //   grow: 2,
        // },
        draw(ctx, n) {
          const path = new Path2D()
          path.rect(0, 0, n.width(), n.height())
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
      hookDrawText({
        width: 50,
        config: {
          text: "abwefw aef aew awe awe awe awefewf aefawe ",
          lineHeight: 20
        },
        draw(ctx, n, draw) {
          return {
            operates: [
              {
                type: "stroke",
                width: 4,
                style: "green"
              },
              {
                type: "draw",
                callback: draw
              }
            ]
          }
        },
        drawInfo: {
          style: 'red'
        }
      })
      hookDrawUrlImage({
        width: 100,
        relay: "width",
        src: "https://picsum.photos/363/423",
        draw(ctx, n, draw) {
          return {
            operates: [
              {
                type: "stroke",
                width: 6,
                style: "blue"
              },
              {
                type: "draw",
                callback: draw
              }
            ]
          }
        }
      })
    },
  })
}



