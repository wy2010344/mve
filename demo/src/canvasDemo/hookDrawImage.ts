import { hookPromiseSignal, promiseSignal, renderOne } from "mve-helper";
import { DrawRectConfig, hookDrawRect } from "./hookDrawRect";
import { loadImage } from "wy-dom-helper";
import { EmptyFun, SetValue, SizeKey, ValueOrGet, valueOrGetToGet } from "wy-helper";




export function hookDrawUrlImage(n: DrawRectConfig & {
  src: ValueOrGet<string>
  relay?: SizeKey
  onLoading?: EmptyFun,
  onError?: SetValue<any>
}) {
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


export function hookDrawImage(n: DrawRectConfig & {
  image: ValueOrGet<HTMLImageElement>
  relay?: SizeKey | undefined
}) {
  const getImage = valueOrGetToGet(n.image)
  if (n.relay == 'width') {
    n.height = (n) => {
      const image = getImage()
      return image.naturalHeight * n.width() / image.naturalWidth
    }
  } else if (n.relay == 'height') {
    n.width = n => {
      const image = getImage()
      return image.naturalWidth * n.height() / image.naturalHeight
    }
  } else {
    n.width = n => {
      const image = getImage()
      return image.naturalWidth
    }
    n.height = n => {
      const image = getImage()
      return image.naturalHeight
    }
  }
  return hookDrawRect({
    ...n,
    draw(ctx, n) {
      const image = getImage()
      ctx.drawImage(image, 0, 0, n.width(), n.height())
    },
  })
}

export function imageLoadSignal(src: string) {
  return promiseSignal(loadImage(src))
}