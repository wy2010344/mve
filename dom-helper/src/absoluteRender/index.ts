import { hookAddDestroy } from "mve-core"
import { DomElement, DomElementType } from "wy-dom-helper"
import { addEffect, batchSignalEnd, createSignal, GetValue, PointKey, SetValue, ValueOrGet } from "wy-helper"
import { InstanceCallbackOrValue, MDisplayOut } from "wy-helper"
import { createLayoutNode, LayoutNode } from "wy-helper"





/**
 * 应该可以细分
 */
type DomConfigure<T extends DomElementType> =
  ({
    width?: InstanceCallbackOrValue<LayoutNode<DomElement<T>, PointKey>>
    height?: InstanceCallbackOrValue<LayoutNode<DomElement<T>, PointKey>>
  })
  | ({
    width: 'auto'
    height?: InstanceCallbackOrValue<LayoutNode<DomElement<T>, PointKey>>
  })
  | ({
    width?: InstanceCallbackOrValue<LayoutNode<DomElement<T>, PointKey>>
    height: 'auto'
  })
  | {
    width: 'auto'
    height: 'auto'
  }

export type ADomAttributes<T extends DomElementType> = DomConfigure<T> & {
  m_display?: ValueOrGet<MDisplayOut<PointKey>>
} & {
  x?: InstanceCallbackOrValue<LayoutNode<DomElement<T>, PointKey>>
  y?: InstanceCallbackOrValue<LayoutNode<DomElement<T>, PointKey>>

  paddingLeft?: ValueOrGet<number>
  paddingRight?: ValueOrGet<number>

  paddingTop?: ValueOrGet<number>
  paddingBottom?: ValueOrGet<number>
  render(style: any): DomElement<T>
}
export function renderADom<T extends DomElementType>(
  arg: ADomAttributes<T>
): LayoutNode<DomElement<T>, PointKey> {
  return renderAbsolute(arg) as any
}

// type SvgConfigure<T extends SvgElementType> = InOrFun<
//   Omit<FSvgAttribute<T>, 's_width'
//     | 's_height'
//     | 's_position'
//     | 's_display'
//     | 's_left'
//     | 's_right'
//     | 's_top'
//     | 's_bottom'>
// > & BSvgEvent<T> & FGetChildAttr<SvgElement<T>>
// export function renderASvg<T extends SvgElementType>(type: T, arg: SvgConfigure<T> & AbsoluteConfigure): MAbsoluteNode {
//   const target = document.createElementNS("http://www.w3.org/2000/svg", type)
//   return renderAbsolute(target, arg, true)
// }
function renderAbsolute(c: any) {
  let wSet: SetValue<number> | undefined = undefined
  let hSet: SetValue<number> | undefined = undefined
  let width: GetValue<number>
  let height: GetValue<number>
  if (c.width == 'auto') {
    const w = createSignal(0)
    width = w.get
    wSet = w.set
  } else {
    width = c.width
  }


  if (c.height == 'auto') {
    const h = createSignal(0)
    height = h.get
    hSet = h.set
  } else {
    height = c.height
  }

  const addDestroy = hookAddDestroy()
  if (wSet || hSet) {
    addEffect(() => {
      const cb = () => {
        wSet?.(target.clientWidth)
        hSet?.(target.clientHeight)
        batchSignalEnd()
      }
      cb()
      const ob = new ResizeObserver(cb)
      ob.observe(target)
      addDestroy(() => {
        ob.disconnect()
      })
    }, -2)
  }
  const n = createLayoutNode({
    ...c,
    axis: {
      x: {
        position: c.x,
        size: width,
        paddingStart: c.paddingLeft,
        paddingEnd: c.paddingRight
      },
      y: {
        position: c.y,
        size: height,
        paddingStart: c.paddingTop,
        paddingEnd: c.paddingBottom
      }
    }
  })
  const style: any = {
    position: 'absolute',
    minWidth: 0,
    minHeight: 0,
    left() {
      return n.axis.x.position() + 'px'
    },
    top() {
      return n.axis.y.position() + 'px'
    }
  }
  if (!wSet) {
    style.width = function () {
      return n.axis.x.size() + 'px'
    }
  }
  if (!hSet) {
    style.heigh = function () {
      return n.axis.y.size() + 'px'
    }
  }
  const target = c.render(style)
  n.target = target
  return n
}
