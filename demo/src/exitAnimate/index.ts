import { faker } from "@faker-js/faker";
import { animate } from "motion";
import { hookAddResult } from "mve-core";
import { fdom } from "mve-dom";
import { renderExitArrayClone } from "mve-dom-helper";
import { ExitModel, getExitAnimateArray, renderArray, renderIf } from "mve-helper";
import { createSignal, emptyArray, GetValue } from "wy-helper";


/**
 * @todo
 * 退出的时候,克隆元素
 */
export default function () {
  const list = createSignal<{
    time: number
  }[]>(emptyArray as any[])



  function renderRow(row: ExitModel<RowModel>, getIndex: GetValue<number>) {
    const div = fdom.div({
      s_display: 'flex',
      s_gap: '10px',
      children() {
        fdom.span({
          childrenType: "text",
          children: getIndex
        })
        fdom.span({
          childrenType: "text",
          children: row.value.time + ''
        })
        fdom.button({
          childrenType: "text",
          children: "x",
          s_paddingInline: '10px',
          s_background: 'gray',
          onClick() {
            list.set(list.get().filter(x => x != row.value))
          }
        })
        fdom.button({
          childrenType: "text",
          children: "替换",
          s_paddingInline: '10px',
          s_background: 'gray',
          onClick() {
            list.set(
              list.get().map(v => {
                if (v == row.value) {
                  return {
                    ...v,
                    time: Date.now()
                  }
                }
                return v
              })
            )
          }

        })
      }
    })
    return div
  }
  fdom.div({
    s_display: 'flex',
    s_flexDirection: 'column',
    s_alignItems: 'center',
    children() {

      const modeIdx = createSignal(0)
      const waitIdx = createSignal(0)
      function mode() {
        const idx = modeIdx.get() % 2
        if (idx == 0) {
          return 'pop'
        } else if (idx == 1) {
          return 'shift'
        }
      }
      function wait() {
        const idx = waitIdx.get() % 3
        if (idx == 1) {
          return 'in-out'
        } else if (idx == 2) {
          return 'out-in'
        }
      }
      const getList = getExitAnimateArray(list.get, {
        mode,
        wait
      })


      fdom.div({
        s_display: 'flex',
        s_gap: "10px",
        children() {
          fdom.button({
            childrenType: "text",
            onClick() {
              modeIdx.set(modeIdx.get() + 1)
            },
            children() {
              return `mode: ${mode() || 'normal'}`
            }
          })
          fdom.button({
            childrenType: "text",
            onClick() {
              waitIdx.set(waitIdx.get() + 1)
            },
            children() {
              return `wait: ${wait() || 'normal'}`
            }
          })
        }
      })

      renderExitArrayClone(getList, (row, getIndex) => {
        const div = renderRow(row, getIndex)
        animate(div, {
          x: ['100%', 0]
        }).finished.then(row.resolve)
        return {
          node: div,
          applyAnimate(node) {
            animate(node as HTMLDivElement, {
              x: [0, '100%']
            }).finished.then(row.resolve)
          },
        }
      })
      // renderArray(() => {

      //   const rw = getList()
      //   console.log("rw", rw)
      //   return rw
      // }, (row, getIndex) => {
      //   const div = renderRow(row, getIndex)
      //   console.log("render", row)
      //   hookTrackSignal(row.exiting, (v) => {
      //     console.log("ss", row, v)
      //     animate(div, {
      //       x: v ? [0, '100%'] : ['100%', 0]
      //     }).finished.then(row.resolve)
      //   })
      // })

      fdom.button({
        onClick() {
          const row = {
            time: Date.now()
          }
          const rows = list.get().slice()
          const idx = faker.number.int({
            min: 0,
            max: rows.length
          })
          rows.splice(idx, 0, row)
          list.set(rows)
        },
        childrenType: "text",
        children: "随机增加"
      })
    }
  })

}

type RowModel = {
  time: number
}