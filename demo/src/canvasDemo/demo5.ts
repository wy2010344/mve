import { addEffect, createSignal, emptyArray } from "wy-helper";
import { AbsoluteNode, hookDrawRect, simpleFlex, hookDrawText, CanvasRectNode } from "mve-dom-helper";
import { renderArray } from "mve-helper";
import { dom, renderPortal } from "mve-dom";
import { hookAlterStateHolder, hookCurrentStateHolder } from "mve-core";

export default function () {

  const a = createSignal(0)
  const list = createSignal(emptyArray as readonly number[])



  hookDrawRect({
    layout(v) {
      return simpleFlex({
        direction: "y"
      })
    },
    children() {

      renderArray(list.get, function (row, getIndex) {
        console.log("list", row)
        const n: CanvasRectNode = hookDrawText({
          width: 100,
          config() {
            return {
              config: {
                font: "bold 18px serif"
              },
              text: `${n.target.index()},${a.get()}:${row}--${getIndex()}`,
              lineHeight: 30,
            }
          },
          onClick(e) {
            list.set(list.get().filter(v => v != row))
          },
        })

        const s = hookCurrentStateHolder()
        addEffect(() => {
          hookAlterStateHolder(s)
          renderPortal(document.body, () => {
            dom.div().renderText`${() => n.target.index()}:${a.get}`
          })
          hookAlterStateHolder(undefined)
        })
      })
      hookDrawText({
        width: 40,
        config() {
          return {
            config: {
              font: "bold 18px serif"
            },
            text: "点击",
            lineHeight: 30,
          }
        },
        onClick() {
          a.set(a.get() + 1)
          list.set(list.get().concat(Date.now()))
          console.log("dd", list.get())
        }
      })
    },
  })
}

