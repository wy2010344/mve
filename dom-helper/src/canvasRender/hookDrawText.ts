import { EmptyFun, memo, quote, Quote, ValueOrGet, valueOrGetToGet } from "wy-helper"
import { CanvasRectNode, DrawRectConfig, hookDrawRect } from "./hookDrawRect"
import { drawTextWrap, measureTextWrap, DrawTextWrapExt, TextWrapTextConfig, drawText, measureText, DrawTextExt, OCanvasTextDrawingStyles, MeasuredTextWrapOut } from "wy-dom-helper/canvas"
import { CanvaRenderCtx, hookCurrentCtx, PathResult } from "."

type TextWrapConfig = TextWrapTextConfig & {
  text: string
  lineHeight?: number | Quote<number>
  maxLines?: number
}

export type DrawTextConfig = Omit<OCanvasTextDrawingStyles, 'textBaseline' | 'textAlign'> & {
  text: string
}

type DrawTextOut = Omit<DrawTextExt, 'y' | 'x'>
export function hookDrawText(arg: {
  config: ValueOrGet<DrawTextConfig>
  draw?(ctx: CanvaRenderCtx, n: CanvasRectNode, draw: EmptyFun, p: Path2D): Partial<PathResult>
  drawInfo?: ((arg: DrawTextConfig & {
    measure: TextMetrics
  }) => DrawTextOut) | DrawTextOut,
  width?: Quote<number> | number,
  height?: Quote<number> | number
} & Omit<DrawRectConfig, 'width' | 'height' | 'draw'>) {
  const getConfig = valueOrGetToGet(arg.config)
  const getDrawInfo = valueOrGetToGet(arg.drawInfo)
  const getWidth = valueOrGetToGet(arg.width || quote)
  const getHeight = valueOrGetToGet(arg.height || quote)
  const d = hookDrawRect({
    ...arg,
    width() {
      return getWidth(mout().measure.width)
    },
    height() {
      return mout().height
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
      height: number
      lineDiffStart: number
    }
    out.textBaseline = 'top'
    const m = measureText(hookCurrentCtx(), c.text, out)
    out.measure = m

    const fontHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
    let lineHeight = getHeight(fontHeight)
    const minLineHeight = fontHeight * 1.5
    if (lineHeight < minLineHeight) {
      lineHeight = minLineHeight
    }
    out.height = lineHeight
    out.lineDiffStart = (lineHeight - fontHeight) / 2
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
  height?: Quote<number> | number
} & Omit<DrawRectConfig, 'height' | 'draw'>) {
  const getConfig = valueOrGetToGet(arg.config)
  const getDrawInfo = valueOrGetToGet(arg.drawInfo)
  const getHeight = valueOrGetToGet(arg.height || quote)
  const d = hookDrawRect({
    ...arg,
    height() {
      return getHeight(mout().height)
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