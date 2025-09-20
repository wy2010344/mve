import {
  AlignSelfFun,
  InstanceCallbackOrValue,
  LayoutConfig,
  Point,
  PointKey,
  ValueOrGet,
} from 'wy-helper'
import { LayoutNodeConfigure, LayoutNode, createLayoutNode } from 'wy-helper'
import {
  CMNode,
  CNodePathConfigure,
  DrawArgWithPath,
  hookCurrentPath,
  hookDraw,
} from './hookDraw'
import { drawRoundedRect } from 'wy-dom-helper/canvas'
export { simpleFlex } from 'wy-helper'

export type DrawArgRect = DrawArgWithPath & {
  rect: LayoutNode<CMNode, keyof Point<number>>
}
export type DrawRectConfig = Omit<
  LayoutNodeConfigure<CMNode, PointKey>,
  'axis'
> &
  Omit<CNodePathConfigure, 'x' | 'y' | 'draw' | 'withPath' | 'skipDraw'> & {
    skipDraw?(n: LayoutNode<CMNode, keyof Point<number>>): any

    padding?: ValueOrGet<number>
    paddingInline?: ValueOrGet<number>
    paddingBlock?: ValueOrGet<number>

    x?: InstanceCallbackOrValue<LayoutNode<CMNode, PointKey>>
    widthAsInner?: boolean
    width?: InstanceCallbackOrValue<LayoutNode<CMNode, PointKey>>
    paddingLeft?: ValueOrGet<number>
    paddingRight?: ValueOrGet<number>

    y?: InstanceCallbackOrValue<LayoutNode<CMNode, PointKey>>
    heightAsInner?: boolean
    height?: InstanceCallbackOrValue<LayoutNode<CMNode, PointKey>>
    paddingTop?: ValueOrGet<number>
    paddingBottom?: ValueOrGet<number>

    alignSelf?: AlignSelfFun
    alignSelfX?: AlignSelfFun
    alignSelfY?: AlignSelfFun
    draw?(arg: DrawArgRect): void
  }

const config: LayoutConfig<CMNode, PointKey> = {
  getLayout(m): void | LayoutNode<CMNode, keyof Point<number>> {
    return m.ext.rect
  },
  getParentLayout(m): void | LayoutNode<CMNode, keyof Point<number>> {
    let x = m.parent
    while (x) {
      const rect = x.ext.rect
      if (rect) {
        return rect
      }
      x = (x as any).parent
    }
  },
  getChildren(m): readonly CMNode[] {
    return m.children()
  },
}
export function hookDrawRect(n: DrawRectConfig) {
  const {
    padding,
    paddingBlock = padding,
    paddingInline = padding,
    paddingTop = paddingBlock,
    paddingBottom = paddingBlock,
    paddingLeft = paddingInline,
    paddingRight = paddingInline,
  } = n
  const x = createLayoutNode(config, {
    ...n,
    axis: {
      x: {
        sizeAsInner: n.widthAsInner,
        position: n.x,
        size: n.width,
        paddingStart: paddingLeft,
        paddingEnd: paddingRight,
        alignSelf: n.alignSelfX ?? n.alignSelf,
      },
      y: {
        sizeAsInner: n.heightAsInner,
        position: n.y,
        size: n.height,
        paddingStart: paddingTop,
        paddingEnd: paddingBottom,
        alignSelf: n.alignSelfY ?? n.alignSelf,
      },
    },
  })
  const skipDraw = n.skipDraw
  x.target = hookDraw({
    ...n,
    x: x.axis.x.position,
    y: x.axis.y.position,
    withPath: true,

    skipDraw: skipDraw ? () => skipDraw(x) : undefined,
    draw: n.draw
      ? function (arg) {
          const before = m._mve_canvas_render_current_rect
          m._mve_canvas_render_current_rect = x
          const args = arg as DrawArgRect
          args.rect = x
          n.draw!(args)
          m._mve_canvas_render_current_rect = before
        }
      : undefined,
    ext: {
      ...n.ext,
      rect: x,
    },
  })
  x.parent = config.getParentLayout(x.target)
  return x
}

const m = globalThis as unknown as {
  _mve_canvas_render_current_rect: LayoutNode<CMNode, keyof Point<number>>
}

export function hookCurrentRect() {
  return m._mve_canvas_render_current_rect!
}

function hookAddRectI(
  width: number,
  height: number,
  r: R,
  x: number,
  y: number
) {
  const path = hookCurrentPath()
  if (r) {
    if (typeof r == 'number') {
      drawRoundedRect(path, {
        x,
        y,
        width,
        height,
        r,
      })
    } else {
      drawRoundedRect(path, {
        x,
        y,
        width,
        height,
        ...r,
      })
    }
  } else {
    path.rect(x, y, width, height)
  }
}
type R =
  | number
  | {
      r?: number
      tl?: number
      tr?: number
      bl?: number
      br?: number
    }
export function hookAddRect(r: R = 0) {
  const x = m._mve_canvas_render_current_rect
  const width = x.axis.x.size()
  const height = x.axis.y.size()
  hookAddRectI(width, height, r, 0, 0)
}

export function hookAddInnerRect(r: R = 0) {
  const x = m._mve_canvas_render_current_rect
  const width = x.axis.x.innerSize()
  const height = x.axis.y.innerSize()
  hookAddRectI(
    width,
    height,
    r,
    x.axis.x.paddingStart(),
    x.axis.y.paddingStart()
  )
}
