import { memo, ValueOrGet, valueOrGetToGet } from "wy-helper"
import { DrawRectConfig, hookDrawRect, simpleFlex } from "./hookDrawRect"
import { CanvasStyle, drawTextWrap, measureTextWrap, DrawTextWrapExt, TextWrapTextConfig } from "wy-dom-helper"

type TextConfig = {
  text: string
  lineHeight: number
  config?: TextWrapTextConfig,
  maxLines?: number
}
export function hookDrawText(n: {
  config: ValueOrGet<TextConfig>
  drawInfo: ValueOrGet<DrawTextWrapExt>
} & Omit<DrawRectConfig, 'height'>) {
  const getConfig = valueOrGetToGet(n.config)

  const getDrawInfo = valueOrGetToGet(n.drawInfo)
  const d = hookDrawRect({
    ...n,
    height() {
      return mout().height
    },
    draw(ctx, n) {
      const info = getDrawInfo()
      drawTextWrap(ctx, mout(), info)
    },
  })
  const mout = memo(function () {
    const c = getConfig()
    return measureTextWrap(d.target.ctx, c.text, {
      ...c,
      width: d.drawWidth()
    })
  })
  return d
}