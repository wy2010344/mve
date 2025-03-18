import { EmptyFun, memo, ValueOrGet, valueOrGetToGet } from "wy-helper"
import { CanvasRectNode, DrawRectConfig, hookDrawRect } from "./hookDrawRect"
import { drawTextWrap, measureTextWrap, DrawTextWrapExt, TextWrapTextConfig, drawText, measureText, DrawTextExt, OCanvasTextDrawingStyles, MeasuredTextWrapOut } from "wy-dom-helper/canvas"
import { CanvaRenderCtx, hookCurrentCtx, PathResult } from "."

type TextWrapConfig = TextWrapTextConfig & {
  text: string
  lineHeight: number
  maxLines?: number
}

export type DrawTextConfig = Omit<OCanvasTextDrawingStyles, 'textBaseline' | 'textAlign'> & {
  text: string
}

export function hookDrawText(arg: {
  config: ValueOrGet<DrawTextConfig>
  draw?(ctx: CanvaRenderCtx, n: CanvasRectNode, draw: EmptyFun, p: Path2D): Partial<PathResult>
  drawInfo?: ((arg: DrawTextConfig & {
    measure: TextMetrics
  }) => DrawTextExt) | DrawTextExt
} & Omit<DrawRectConfig, 'width' | 'draw'>) {
  const getConfig = valueOrGetToGet(arg.config)
  const getDrawInfo = valueOrGetToGet(arg.drawInfo)
  const d = hookDrawRect({
    ...arg,
    width() {
      return mout().measure.width
    },
    draw(ctx, n, p) {
      function draw() {
        const c = mout()
        const info = getDrawInfo?.(c)
        drawText(ctx, c, info)
      }
      if (!arg.draw) {
        draw()
      }
      const out = arg.draw?.(ctx, n, draw, p) || {}
      p.rect(0, 0, n.width(), n.height())
      return out as PathResult
    },
  })
  const mout = memo(function () {
    const c = getConfig()
    const out = { ...c } as DrawTextConfig & {
      textBaseline?: CanvasTextBaseline
      measure: TextMetrics
    }
    out.textBaseline = 'top'
    out.measure = measureText(hookCurrentCtx(), c.text, out)
    return out
  })
  return d
}

export function hookDrawTextWrap(arg: {
  /**与字体测量相关 */
  config: ValueOrGet<TextWrapConfig>
  /**只与绘制相关 */
  drawInfo?: ((arg: MeasuredTextWrapOut) => DrawTextWrapExt) | DrawTextWrapExt
  draw?(ctx: CanvaRenderCtx, n: CanvasRectNode, draw: EmptyFun, p: Path2D): Partial<PathResult>
} & Omit<DrawRectConfig, 'height' | 'draw'>) {
  const getConfig = valueOrGetToGet(arg.config)
  const getDrawInfo = valueOrGetToGet(arg.drawInfo)
  const d = hookDrawRect({
    ...arg,
    height() {
      return mout().height
    },
    draw(ctx, n, p) {
      function draw() {
        const m = mout()
        drawTextWrap(ctx, m, getDrawInfo?.(m))
      }
      if (!arg.draw) {
        draw()
      }
      const out = arg.draw?.(ctx, n, draw, p) || {}
      p.rect(0, 0, n.width(), n.height())
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