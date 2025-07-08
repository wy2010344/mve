import { fdom } from "mve-dom"
import { GetValue } from "wy-helper"
import { LunarDay } from "tyme4ts"
import { renderIf } from "mve-helper"
import { cns } from "wy-dom-helper"

export const selectShadowCell = 'select-cell'
export default function renderCell({
  day,
  lunarDay,
  hide,
  selected,
  onClick
}: {
  day: number
  hide: GetValue<boolean>
  lunarDay: LunarDay,
  selected: GetValue<boolean>
  onClick(): void
}) {

  fdom.div({
    className() {
      return cns(
        `flex-1 aspect-square cursor-pointer
                        flex flex-col items-center justify-center gap-1 `,
        hide() && 'opacity-30'
      )
    },
    onClick,
    children() {
      fdom.div({
        className: 'flex items-center justify-center relative aspect-square p-1',
        children() {
          renderIf(selected, () => {
            fdom.div({
              id: selectShadowCell,
              className() {
                return cns(
                  `absolute inset-0 ring-1 rounded-full ring-accent`
                )
              }
            })
          })
          fdom.span({
            className: 'relative text-base-content/80  text-label-large',
            childrenType: 'text',
            children: day
          })
        }
      })
      fdom.div({
        className: 'text-label-small  text-base-content/60',
        childrenType: "text",
        children: lunarDay.getName()
      })
    }
  })
}
