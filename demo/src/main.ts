import { getScheduleAskTime } from "wy-helper"
import { createVueInstance } from "wy-helper/Vue"

document.querySelector<HTMLDivElement>('#app')


const scheduler = createVueInstance(
  getScheduleAskTime({
    limitFlush: requestAnimationFrame
  }),
  function () {

  }
)