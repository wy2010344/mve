import { EmptyFun, memo, quote, Quote, ValueOrGet, valueOrGetToGet } from "wy-helper"
import { DrawRectConfig, hookDrawRect } from "./hookDrawRect"
import { drawTextWrap, measureTextWrap, DrawTextWrapExt, TextWrapTextConfig, drawText, measureText, DrawTextExt, OCanvasTextDrawingStyles, MeasuredTextWrapOut } from "wy-dom-helper/canvas"
import { CanvaRenderCtx, CMNode, hookCurrentCtx, PathResult } from "./hookDraw"
import { CanvasRectNode } from "../createLayout/2D"

type TextWrapConfig = TextWrapTextConfig & {
  text: string
  lineHeight?: number | Quote<number>
  maxLines?: number
}

export type DrawTextConfig = Omit<OCanvasTextDrawingStyles, 'textBaseline' | 'textAlign'> & {
  text: string
}

let currentDefaultFont: CSSStyleDeclaration = undefined as any
function makeCurrentDefaultFont(out: any) {
  if (!currentDefaultFont) {
    currentDefaultFont = getComputedStyle(document.body)
  }
  const def = currentDefaultFont
  out.fontFamily = out.fontFamily || def.fontFamily
  out.fontSize = out.fontSize || def.fontSize
  out.fontStyle = out.fontStyle || def.fontStyle
  out.fontWeight = out.fontWeight || def.fontWeight
}
type DrawTextOut = Omit<DrawTextExt, 'y' | 'x'>
export function hookDrawText(arg: {
  config: ValueOrGet<DrawTextConfig>
  draw?(ctx: CanvaRenderCtx, n: CanvasRectNode<CMNode>, draw: EmptyFun, p: Path2D): Partial<PathResult>
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
    makeCurrentDefaultFont(out)
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
  draw?(ctx: CanvaRenderCtx, n: CanvasRectNode<CMNode>, draw: EmptyFun, p: Path2D): Partial<PathResult>
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
      return out as PathResult
    },
  })
  const mout = memo(function () {
    const c = { ...getConfig() } as any
    makeCurrentDefaultFont(c)
    const ctx = hookCurrentCtx()
    c.width = d.drawWidth()
    return measureTextWrap(ctx, c.text, c)
  })
  return d
}