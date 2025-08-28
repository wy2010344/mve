import { hookAddDestroy, addTrackEffect } from "mve-core"
import { StyleProps } from "mve-dom"
import { hookTrackSignal } from "mve-helper"
import { DomElement, DomElementType } from "wy-dom-helper"
import { addEffect, batchSignalEnd, createSignal, emptyArray, emptyFun, GetValue, LayoutConfig, LayoutNodeConfigure, PointKey, SetValue, ValueOrGet } from "wy-helper"
import { InstanceCallbackOrValue, MDisplayOut } from "wy-helper"
import { createLayoutNode, LayoutNode, } from "wy-helper"





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

export type ADomAttributes<T extends DomElementType> = DomConfigure<T> & Omit<LayoutNodeConfigure<DomElement<T>, PointKey>, 'axis'> & {
  x?: InstanceCallbackOrValue<LayoutNode<DomElement<T>, PointKey>>
  y?: InstanceCallbackOrValue<LayoutNode<DomElement<T>, PointKey>>

  paddingLeft?: ValueOrGet<number>
  paddingRight?: ValueOrGet<number>

  paddingTop?: ValueOrGet<number>
  paddingBottom?: ValueOrGet<number>
  render(style: StyleProps, n: LayoutNode<DomElement<T>, PointKey>): DomElement<T>
}

const config: LayoutConfig<Node, PointKey> = {
  getLayout(m: any) {
    return m._rect
  },
  getParentLayout(m: any) {
    return m.parentNode?._rect
  },
  getChildren(m) {
    return (m as any)._mve_children_?.() || emptyArray
  },
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

export function renderADom<T extends DomElementType>(
  c: ADomAttributes<T>
): LayoutNode<DomElement<T>, PointKey> {
  let wSet: SetValue<number> | undefined = undefined
  let hSet: SetValue<number> | undefined = undefined
  let width: ValueOrGet<number> | undefined
  let height: ValueOrGet<number> | undefined
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
      const cb = (e?: any) => {
        wSet?.(target.clientWidth)
        hSet?.(target.clientHeight)
        if (e) {
          batchSignalEnd()
        }
      }
      cb()
      const ob = new ResizeObserver(cb)
      ob.observe(target)
      addDestroy(() => {
        ob.disconnect()
      })
    }, -2)
  }
  const n = createLayoutNode(config as any, {
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
    style.height = function () {
      return n.axis.y.size() + 'px'
    }
  }
  const target = c.render(style, n)
  n.target = target;
  (target as any)._rect = n
  return n
}
