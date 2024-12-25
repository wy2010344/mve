
import { emptyObject } from "wy-helper"
const LineBreaker = require('linebreak');

export type OCanvasTextDrawingStyles = Partial<CanvasTextDrawingStyles>

function setDrawingStyle(
  ctx: CanvasTextDrawingStyles,
  n: OCanvasTextDrawingStyles = emptyObject as any,
  ig = false
) {
  if (!ig) {
    ctx.direction = n.direction || 'inherit'
    ctx.textBaseline = n.textBaseline || 'alphabetic'
    ctx.textAlign = n.textAlign || 'start'
  }
  ctx.font = n.font || ''
  ctx.fontKerning = n.fontKerning || 'auto'
  ctx.fontStretch = n.fontStretch || 'normal'
  ctx.fontVariantCaps = n.fontVariantCaps || 'normal'
  ctx.letterSpacing = n.letterSpacing || '0px'
  ctx.textRendering = n.textRendering || 'auto'
  ctx.wordSpacing = n.wordSpacing || '0px'
}
export function measureText(
  ctx: MCtx,
  text: string,
  config?: OCanvasTextDrawingStyles) {
  setDrawingStyle(ctx, config)
  return ctx.measureText(text)
}

export type MeasuredTextWrapOut = {
  width: number
  height: number
  lineHeight: number
  config?: TextWrapTextConfig
  lines: {
    width: number
    text: string
  }[]
}


type MCtx = CanvasTextDrawingStyles & {
  measureText(text: string): TextMetrics
}
type TextWrapTextConfig = Omit<OCanvasTextDrawingStyles, 'direction' | 'textAlign' | 'textBaseline'>
export function measureTextWrap(
  ctx: MCtx,
  text: string,
  config: {
    config?: TextWrapTextConfig
    lineHeight: number
    width: number
    maxLines?: number
  }
): MeasuredTextWrapOut {
  let maxLines = config.maxLines || Infinity
  if (maxLines < 1) {
    maxLines = Infinity
  }
  setDrawingStyle(ctx, config.config, true)
  const m = ctx.measureText(text)

  if (m.width <= config.width) {
    return {
      width: m.width,
      lineHeight: config.lineHeight,
      height: config.lineHeight,
      config: config.config,
      lines: [
        {
          width: m.width,
          text: text
        }
      ]
    }
  } else {
    const breaker = new LineBreaker(text);
    let bk, lastBreak, tryLine, currentLine = '', lastMeasuredWidth
    const measuredSize = {
      width: config.width,
      height: 0,
      lineHeight: config.lineHeight,
      config: config.config,
      lines: [] as {
        width: number
        text: string
      }[]
    }
    while (bk = breaker.nextBreak()) {
      var word = text.slice(lastBreak ? lastBreak.position : 0, bk.position);
      tryLine = currentLine + word;
      const textMetrics = ctx.measureText(tryLine);
      if (textMetrics.width > config.width || (lastBreak && lastBreak.required)) {
        const line = {
          width: lastMeasuredWidth!,
          text: currentLine!.trim()
        }
        measuredSize.lines.push(line);
        if (measuredSize.lines.length == maxLines) {
          const rest = text.slice(bk.position).trim()
          if (rest) {
            line.text = line.text.replace(/\,?\s?\w+$/, '…');
            line.width = ctx.measureText(line.text).width
          }
          measuredSize.height = measuredSize.lines.length * config.lineHeight
          return measuredSize
        }

        currentLine = word;
        lastMeasuredWidth = ctx.measureText(currentLine.trim()).width;
      } else {
        currentLine = tryLine;
        lastMeasuredWidth = textMetrics.width;
      }
      lastBreak = bk;
    }
    currentLine = currentLine!.trim();
    if (currentLine.length > 0) {
      const textMetrics = ctx.measureText(currentLine);
      measuredSize.lines.push({ width: textMetrics.width, text: currentLine });
    }
    measuredSize.height = measuredSize.lines.length * config.lineHeight
    return measuredSize
  }
}

type TextCtx = CanvasTextDrawingStyles & {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/fillStyle) */
  fillStyle: string | CanvasGradient | CanvasPattern;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/strokeStyle) */
  strokeStyle: string | CanvasGradient | CanvasPattern;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/fillText) */
  fillText(text: string, x: number, y: number, maxWidth?: number): void;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/strokeText) */
  strokeText(text: string, x: number, y: number, maxWidth?: number): void;
}
export function drawTextWrap(
  ctx: TextCtx,
  text: MeasuredTextWrapOut,
  style: string | CanvasGradient | CanvasPattern,
  arg?: {
    x?: number
    y?: number
    stroke?: boolean
    direction?: 'ltr' | 'rtl'
    textAlign?: 'start' | 'center' | 'end'
  }
) {
  const x = arg?.x || 0
  const y = arg?.y || 0
  setDrawingStyle(ctx, text?.config, true)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const direction = arg?.direction || 'ltr'
  ctx.direction = direction


  let fun: 'strokeText' | 'fillText'
  if (arg?.stroke) {
    ctx.strokeStyle = style
    fun = 'strokeText'
  } else {
    ctx.fillStyle = style
    fun = 'fillText'
  }
  let curY = y
  const textAlign = arg?.textAlign || 'left'
  for (let i = 0; i < text.lines.length; i++) {
    const line = text.lines[i]
    let curX = x
    if (textAlign == 'center') {
      curX = x + (text.width - line.width) / 2
    } else if (
      (textAlign == 'end' && direction == 'ltr') ||
      (textAlign == 'start' && direction == 'rtl')
    ) {
      curX = x + text.width - line.width
    }
    ctx[fun](line.text, curX, curY)
    curY += text.lineHeight
  }
}
export function drawText(
  ctx: TextCtx,
  text: string,
  style: string | CanvasGradient | CanvasPattern,
  arg?: {
    config?: OCanvasTextDrawingStyles,
    x?: number
    y?: number
    maxWidth?: number
    stroke?: boolean
  }
) {
  const x = arg?.x || 0
  const y = arg?.y || 0
  setDrawingStyle(ctx, arg?.config)
  let fun: 'strokeText' | 'fillText'
  if (arg?.stroke) {
    ctx.strokeStyle = style
    fun = 'strokeText'
  } else {
    ctx.fillStyle = style
    fun = 'fillText'
  }
  ctx[fun](text, x, y)
}