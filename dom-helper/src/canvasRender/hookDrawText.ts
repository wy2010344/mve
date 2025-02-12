import { EmptyFun, memo, ValueOrGet, valueOrGetToGet } from "wy-helper"
import { CanvasRectNode, DrawRectConfig, hookDrawRect } from "./hookDrawRect"
import { drawTextWrap, measureTextWrap, DrawTextWrapExt, TextWrapTextConfig } from "wy-dom-helper"
import { CanvaRenderCtx, hookCurrentCtx, PathResult } from "."

type TextConfig = {
  text: string
  lineHeight: number
  config?: TextWrapTextConfig,
  maxLines?: number
}
export function hookDrawText(arg: {
  config: ValueOrGet<TextConfig>
  drawInfo?: ValueOrGet<DrawTextWrapExt>
  draw?(ctx: CanvaRenderCtx, n: CanvasRectNode, draw: EmptyFun): Partial<PathResult>
} & Omit<DrawRectConfig, 'height' | 'draw'>) {
  const getConfig = valueOrGetToGet(arg.config)

  const getDrawInfo = valueOrGetToGet(arg.drawInfo)
  const d = hookDrawRect({
    ...arg,
    height() {
      return mout().height
    },
    draw(ctx, n) {
      const info = getDrawInfo()
      function draw() {
        drawTextWrap(ctx, mout(), info)
      }
      if (!arg.draw) {
        draw()
      }
      const out = arg.draw?.(ctx, n, draw) || {}
      if (!out.path) {
        const path = new Path2D()
        path.rect(0, 0, n.width(), n.height())
        out.path = path
      }
      return out as PathResult
    },
  })
  const mout = memo(function () {
    const c = getConfig()
    const ctx = hookCurrentCtx()
    return measureTextWrap(ctx, c.text, {
      ...c,
      width: d.drawWidth()
    })
  })
  return d
}