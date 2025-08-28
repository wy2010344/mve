import { EmptyFun } from "wy-helper"


export const mdraw = globalThis as unknown as {
  _mve_canvas_render_current_rect_draw: EmptyFun
}

export function hookCurrentDraw() {
  mdraw._mve_canvas_render_current_rect_draw()
}