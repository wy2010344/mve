import { memo, ValueOrGet, valueOrGetToGet } from "wy-helper"
import { DrawRectConfig, hookDrawRect, simpleFlex } from "./hookDrawRect"
import { CanvasStyle, drawTextWrap, measureTextWrap, DrawTextWrapExt, TextWrapTextConfig } from "wy-dom-helper"
import { hookDrawText } from "./hookDrawText"
import { hookDrawImage, hookDrawUrlImage } from "./hookDrawImage"

export default function () {

  hookDrawRect({
    x: 20,
    y: 20,
    height: 500,
    width: 400,
    paddingLeft: 10,
    paddingRight: 20,
    paddingBottom: 30,
    paddingTop: 40,
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
        alignItems: 'start',
        alignFix: true
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
      // hookDrawRect({
      //   height: 30,
      //   // height: 20,
      //   ext: {
      //     grow: 1,
      //   },
      //   draw(ctx, n) {
      //     const path = new Path2D()
      //     path.rect(0, 0, n.width(), n.height())
      //     return {
      //       path,
      //       operates: [
      //         {
      //           type: "fill",
      //           style: "red"
      //         }
      //       ]
      //     }
      //   },
      // })
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
      hookDrawRect({
        width: 50,
        height: 30,
      })
      hookDrawText({
        width: 50,
        config: {
          text: "abwefw aef aew awe awe awe awefewf aefawe ",
          lineHeight: 20
        },
        drawInfo: {
          style: 'red'
        }
      })
      hookDrawUrlImage({
        width: 100,
        relay: "width",
        src: "https://picsum.photos/363/423"
      })
    },
  })
}



