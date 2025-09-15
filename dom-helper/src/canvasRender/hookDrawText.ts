import {
  EmptyFun,
  LayoutNode,
  memo,
  Point,
  quote,
  Quote,
  ValueOrGet,
  valueOrGetToGet,
} from 'wy-helper'
import { DrawRectConfig, hookDrawRect } from './hookDrawRect'
import {
  drawTextWrap,
  measureTextWrap,
  DrawTextWrapExt,
  TextWrapTextConfig,
  drawText,
  measureText,
  DrawTextExt,
  OCanvasTextDrawingStyles,
  MeasuredTextWrapOut,
  setDrawingStyle,
} from 'wy-dom-helper/canvas'
import { CanvaRenderCtx, CMNode, getOneCtx } from './hookDraw'
import { mdraw } from './hookCurrentDraw'

type TextWrapConfig = TextWrapTextConfig & {
  text: string
  lineHeight?: number | Quote<number>
  maxLines?: number
}

export type DrawTextConfig = Omit<
  OCanvasTextDrawingStyles,
  'textBaseline' | 'textAlign'
> & {
  text: string
}

let currentDefaultFont: CSSStyleDeclaration = undefined as any

export type MeasuredTextOut = DrawTextConfig & {
  textBaseline?: CanvasTextBaseline
  measure: TextMetrics
  height: number
  lineDiffStart: number
}
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
export function hookDrawText(
  arg: {
    config: ValueOrGet<DrawTextConfig>
    draw?(ctx: CanvaRenderCtx, draw: EmptyFun, p: Path2D): void
    drawInfo?:
      | ((
          arg: DrawTextConfig & {
            measure: TextMetrics
          }
        ) => DrawTextOut)
      | DrawTextOut
    width?: Quote<number> | number
    height?: Quote<number> | number
  } & Omit<DrawRectConfig, 'width' | 'height' | 'draw'>
) {
  const getConfig = valueOrGetToGet(arg.config)
  const getDrawInfo = valueOrGetToGet(arg.drawInfo)
  const getWidth = valueOrGetToGet(arg.width || quote)
  const getHeight = valueOrGetToGet(arg.height || quote)
  const mout = memo(function () {
    const ctx = getOneCtx()
    const c = getConfig()
    const out = { ...c } as MeasuredTextOut
    makeCurrentDefaultFont(out)
    out.textBaseline = 'top'
    const m = measureText(ctx, c.text, out)
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
  const d = hookDrawRect({
    ...arg,
    width() {
      return getWidth(mout().measure.width)
    },
    height() {
      return mout().height
    },
    draw(ctx, p) {
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
      arg.draw(ctx, draw, p)
      mdraw._mve_canvas_render_current_rect_draw = before
    },
  }) as DrawRectText
  d.measureOut = mout
  return d
}

export type DrawRectText = LayoutNode<CMNode, keyof Point<number>> & {
  measureOut(): MeasuredTextOut
}

export function hookDrawTextWrap(
  arg: {
    /**与字体测量相关 */
    config: ValueOrGet<TextWrapConfig>
    /**只与绘制相关 */
    drawInfo?: ((arg: MeasuredTextWrapOut) => DrawTextWrapExt) | DrawTextWrapExt
    draw?(ctx: CanvaRenderCtx, draw: EmptyFun, p: Path2D): void
    height?: Quote<number> | number
  } & Omit<DrawRectConfig, 'height' | 'draw'>
) {
  const getConfig = valueOrGetToGet(arg.config)
  const getDrawInfo = valueOrGetToGet(arg.drawInfo)
  const getHeight = valueOrGetToGet(arg.height || quote)
  const d = hookDrawRect({
    ...arg,
    height() {
      return getHeight(mout().height)
    },
    draw(ctx, p) {
      function draw() {
        const m = mout()
        drawTextWrap(ctx, m, getDrawInfo?.(m))
      }
      if (!arg.draw) {
        return draw()
      }
      const before = mdraw._mve_canvas_render_current_rect_draw
      mdraw._mve_canvas_render_current_rect_draw = draw
      arg.draw(ctx, draw, p)
      mdraw._mve_canvas_render_current_rect_draw = before
    },
  }) as DrawRectTextWrap
  const config = memo(() => {
    const c = { ...getConfig() } as any
    makeCurrentDefaultFont(c)
    c.width = d.axis.x.innerSize()
    return c
  })
  const mout = memo(function () {
    const c = config()
    const ctx = getOneCtx()
    return measureTextWrap(ctx, c.text, c)
  })

  d.measureCtx = function () {
    const c = config()
    const ctx = getOneCtx()
    setDrawingStyle(ctx, c, true)
    return ctx
  }
  d.measureOut = mout
  return d
}

type DrawRectCtx = {
  //获得供测量的ctx
  measureCtx(): CanvasRenderingContext2D
  measureOut(): MeasuredTextWrapOut
}
export type DrawRectTextWrap = LayoutNode<CMNode, keyof Point<number>> &
  DrawRectCtx

type Glyph = {
  char: string
  x: number
  y: number
  w: number
}
export function drawTextWrapWithSelect({
  selectStart: _selectStart,
  selectEnd: _selectEnd,
  get,
}: {
  selectStart: ValueOrGet<number>
  selectEnd: ValueOrGet<number>
  get: DrawRectCtx
}) {
  const selectStart = valueOrGetToGet(_selectStart)
  const selectEnd = valueOrGetToGet(_selectEnd)
  const memoGraphs = memo(() => {
    const mout = get.measureOut()
    const ctx = get.measureCtx()
    const list = mout.lines.map((line, i) => {
      const chars = [...line.text]
      let beforeWidth = 0
      const y = i * mout.lineHeight
      const glyphs: Glyph[] = []
      for (let i = 0; i < chars.length; i++) {
        const subText = chars.slice(0, i + 1).join('')
        const afterWidth = ctx.measureText(subText).width
        glyphs.push({
          char: chars[i],
          x: beforeWidth,
          y,
          w: afterWidth - beforeWidth,
        })
        beforeWidth = afterWidth
      }
      return {
        y,
        glyphs,
      }
    })
    return {
      list,
      lineHeight: mout.lineHeight,
    }
  })
  function getIndex(e: Point) {
    const { list: mg, lineHeight } = memoGraphs()
    let index = 0
    let notFound = true
    for (let y = 0; y < mg.length && notFound; y++) {
      const row = mg[y]
      if (row.y < e.y && e.y < row.y + lineHeight) {
        for (let x = 0; x < row.glyphs.length; x++) {
          const cell = row.glyphs[x]
          if (e.x < cell.x + cell.w / 2) {
            return index
          }
          index++
        }
        return index
      }
      index += row.glyphs.length
    }
    return index
  }
  const cursorPosition = memo(() => {
    const start = selectStart()
    const end = selectEnd()
    if (start == end) {
      return getPosition(start)
    }
  })
  function getPosition(start: number) {
    const { list: mg, lineHeight } = memoGraphs()
    let mx = 0,
      my = 0
    let notFound = true
    let index = 0
    for (let y = 0; y < mg.length && notFound; y++) {
      const row = mg[y]
      const nextIndex = index + row.glyphs.length
      if (index <= start && start < nextIndex) {
        const diff = start - index
        const cell = row.glyphs[diff]
        mx = cell.x
        my = row.y
        notFound = false
      }
      index = nextIndex
    }
    return {
      x: mx,
      y: my,
    }
  }
  return {
    cursorPosition,
    getIndex,
    draw(
      ctx: {
        fillRect(x: number, y: number, width: number, height: number): void
      },
      zeroWidth = 2
    ) {
      const { list: mg, lineHeight } = memoGraphs()
      const start = selectStart()
      const end = selectEnd()
      const xy = cursorPosition()
      if (xy) {
        ctx.fillRect(xy.x, xy.y, zeroWidth, lineHeight)
      } else {
        let beginY = 0,
          endY = 0
        let beginX = 0,
          endX = 0
        const [min, max] = start > end ? [end, start] : [start, end]
        let index = 0
        let notFound = true
        for (let y = 0; y < mg.length && notFound; y++) {
          const row = mg[y]
          for (let x = 0; x < row.glyphs.length; x++) {
            if (index == min) {
              beginY = y
              beginX = x
            }
            if (index == max) {
              endY = y
              endX = x
              notFound = false
              break
            }
            index++
          }
        }

        function fillSelect(y: number, start: number, end: number) {
          if (start == end) {
            return
          }
          ctx.fillRect(start, y, end - start, lineHeight)
        }
        if (beginY == endY) {
          const row = mg[beginY]
          const start = row.glyphs[beginX].x
          const end = row.glyphs[endX]
          fillSelect(row.y, start, end.x)
        } else {
          const beginRow = mg[beginY]
          const start = beginRow.glyphs[beginX].x
          const end = beginRow.glyphs.at(-1)!
          fillSelect(beginRow.y, start, end.x + end?.w)
          for (let i = beginY + 1; i < endY; i++) {
            const row = mg[i]
            const end = row.glyphs.at(-1)!
            fillSelect(row.y, 0, end.x + end?.w)
          }
          const endRow = mg[endY]
          fillSelect(endRow.y, 0, endRow.glyphs[endX].x)
        }
      }
    },
  }
}
