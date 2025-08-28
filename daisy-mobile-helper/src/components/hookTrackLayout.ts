import { animate } from "motion"
import { hookTrackSignal } from "mve-helper"
import { addEffect, GetValue } from "wy-helper"

export function hookTrackLayout(
  change: GetValue<any>,
  selectShadowCell: string
) {
  hookTrackSignal(change, () => {
    const beforeCell = document.getElementById(selectShadowCell)
    if (beforeCell) {
      let box = beforeCell.getBoundingClientRect()
      addEffect(() => {
        if (beforeCell.isConnected) {
          //仍然在dom上,更新最新的位置
          box = beforeCell.getBoundingClientRect()
        }
        const currentCell = document.getElementById(selectShadowCell)
        if (currentCell) {
          const box2 = currentCell.getBoundingClientRect()
          animate(currentCell, {
            x: [box.left - box2.left, 0],
            y: [box.top - box2.top, 0]
          })
        }
      }, 3)
    }
  })
}