import { EmptyFun, memo, PointKey, quote, Quote, ValueOrGet, valueOrGetToGet } from "wy-helper"
import { DrawRectConfig, hookDrawRect } from "./hookDrawRect"
import { drawTextWrap, measureTextWrap, DrawTextWrapExt, TextWrapTextConfig, drawText, measureText, DrawTextExt, OCanvasTextDrawingStyles, MeasuredTextWrapOut } from "wy-dom-helper/canvas"
import { CanvaRenderCtx, CMNode, hookCurrentCtx } from "./hookDraw"
import { LayoutNode } from "wy-helper"
import { mdraw } from "./hookCurrentDraw"

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
  draw?(ctx: CanvaRenderCtx, n: LayoutNode<CMNode, PointKey>, draw: EmptyFun, p: Path2D): void
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
  return hookDrawRect({
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
        return draw()
      }
      const before = mdraw._mve_canvas_render_current_rect_draw
      mdraw._mve_canvas_render_current_rect_draw = draw
      arg.draw(ctx, n, draw, p)
      mdraw._mve_canvas_render_current_rect_draw = before
    },
  })
}

export function hookDrawTextWrap(arg: {
  /**与字体测量相关 */
  config: ValueOrGet<TextWrapConfig>
  /**只与绘制相关 */
  drawInfo?: ((arg: MeasuredTextWrapOut) => DrawTextWrapExt) | DrawTextWrapExt
  draw?(ctx: CanvaRenderCtx, n: LayoutNode<CMNode, PointKey>, draw: EmptyFun, p: Path2D): void
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
        return draw()
      }
      const before = mdraw._mve_canvas_render_current_rect_draw
      mdraw._mve_canvas_render_current_rect_draw = draw
      arg.draw(ctx, n, draw, p)
      mdraw._mve_canvas_render_current_rect_draw = before
    },
  })
  const mout = memo(function () {
    const c = { ...getConfig() } as any
    makeCurrentDefaultFont(c)
    const ctx = hookCurrentCtx()
    c.width = d.axis.x.drawSize()
    return measureTextWrap(ctx, c.text, c)
  })
  return d
}