import { hookPromiseSignal, promiseSignal, renderOne } from "mve-helper";
import { DrawRectConfig, hookDrawRect } from "./hookDrawRect";
import { loadImage } from "wy-dom-helper";
import { EmptyFun, PointKey, SetValue, SizeKey, ValueOrGet, valueOrGetToGet } from "wy-helper";
import { CanvaRenderCtx, CMNode } from "./hookDraw";
import { LayoutNode } from "wy-helper"
import { mdraw } from "./hookCurrentDraw";




export function hookDrawUrlImage(n: {
  src: ValueOrGet<string>
  draw?(ctx: CanvaRenderCtx, n: LayoutNode<CMNode, PointKey>, draw: EmptyFun): void
  relay?: SizeKey
  onLoading?: EmptyFun,
  onError?: SetValue<any>
} & Omit<DrawRectConfig, 'draw'>) {
  const getSrc = valueOrGetToGet(n.src)
  const signal = hookPromiseSignal(() => () => loadImage(getSrc()))
  renderOne(() => signal.get(), function (v) {
    if (v?.type == 'success') {
      hookDrawImage({
        ...n,
        image: v.value
      })
    } else if (v?.type == 'error') {
      n.onError?.(v.value)
    } else {
      n.onLoading?.()
    }
  })
}


export function hookDrawImage(arg: {
  image: ValueOrGet<HTMLImageElement>
  relay?: SizeKey | undefined
  draw?(ctx: CanvaRenderCtx, n: LayoutNode<CMNode, PointKey>, draw: EmptyFun, path: Path2D): void
} & Omit<DrawRectConfig, 'draw'>) {
  const getImage = valueOrGetToGet(arg.image)
  if (arg.relay == 'width') {
    arg.height = (n) => {
      const image = getImage()
      return image.naturalHeight * n.axis.x.size() / image.naturalWidth
    }
  } else if (arg.relay == 'height') {
    arg.width = n => {
      const image = getImage()
      return image.naturalWidth * n.axis.y.size() / image.naturalHeight
    }
  } else {
    arg.width = n => {
      const image = getImage()
      return image.naturalWidth
    }
    arg.height = n => {
      const image = getImage()
      return image.naturalHeight
    }
  }
  return hookDrawRect({
    ...arg,
    draw(ctx, n, p) {
      const image = getImage()
      function draw() {
        ctx.drawImage(image, 0, 0, n.axis.x.size(), n.axis.y.size())
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

export function imageLoadSignal(src: string) {
  return promiseSignal(loadImage(src))
}
