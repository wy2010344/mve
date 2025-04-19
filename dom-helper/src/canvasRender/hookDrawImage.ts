import { hookPromiseSignal, promiseSignal, renderOne } from "mve-helper";
import { DrawRectConfig, hookDrawRect } from "./hookDrawRect";
import { loadImage } from "wy-dom-helper";
import { EmptyFun, PointKey, PromiseResult, SetValue, SizeKey, StoreRef, ValueOrGet, valueOrGetToGet } from "wy-helper";
import { CanvaRenderCtx, CMNode, PathResult } from "./hookDraw";
import { CanvasRectNode } from "../createLayout/2D";




export function hookDrawUrlImage(n: {
  src: ValueOrGet<string>
  draw?(ctx: CanvaRenderCtx, n: CanvasRectNode<CMNode>, draw: EmptyFun): Partial<PathResult>
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
  draw?(ctx: CanvaRenderCtx, n: CanvasRectNode<CMNode, PointKey>, draw: EmptyFun, path: Path2D): Partial<PathResult>
} & Omit<DrawRectConfig, 'draw'>) {
  const getImage = valueOrGetToGet(arg.image)
  if (arg.relay == 'width') {
    arg.height = (n) => {
      const image = getImage()
      return image.naturalHeight * n.width() / image.naturalWidth
    }
  } else if (arg.relay == 'height') {
    arg.width = n => {
      const image = getImage()
      return image.naturalWidth * n.height() / image.naturalHeight
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
        ctx.drawImage(image, 0, 0, n.width(), n.height())
      }
      if (!arg.draw) {
        draw()
      }
      const out = arg.draw?.(ctx, n, draw, p) || {}
      return out as PathResult
    },
  })
}

export function imageLoadSignal(src: string) {
  return promiseSignal(loadImage(src))
}