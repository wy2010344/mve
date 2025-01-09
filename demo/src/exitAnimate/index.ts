import { faker } from "@faker-js/faker";
import { fdom } from "mve-dom";
import { renderArray } from "mve-helper";
import { createSignal, emptyArray, genTemplateStringS1, GetValue } from "wy-helper";

export default function () {


  const list = createSignal<{
    time: number
  }[]>(emptyArray as any[])



  fdom.div({
    s_display: 'flex',
    s_flexDirection: 'column',
    s_alignItems: 'center',
    children() {

      renderArray(list.get, (row, getIndex) => {
        genTemplateStringS1
        fdom.div({
          s_display: 'flex',
          s_gap: '10px',
          children() {
            fdom.span({
              childrenType: "text",
              children: getIndex
            })
            fdom.span({
              childrenType: "text",
              children: row.time + ''
            })
            fdom.button({
              childrenType: "text",
              children: "x",
              s_paddingInline: '10px',
              s_background: 'gray',
              onClick() {
                list.set(list.get().filter(x => x != row))
              }
            })
          }
        })
      })

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


function renderExitAnimate<T>(
  get: GetValue<T[]>
) {

}