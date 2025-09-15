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
  CanvaRenderCtx,
  CMNode,
  CNodePathConfigure,
  hookDraw,
} from './hookDraw'
export { simpleFlex } from 'wy-helper'

export type DrawRectConfig = Omit<
  LayoutNodeConfigure<CMNode, PointKey>,
  'axis'
> &
  Omit<CNodePathConfigure, 'x' | 'y' | 'draw' | 'withPath' | 'skipDraw'> & {
    skipDraw?(n: LayoutNode<CMNode, keyof Point<number>>): any
    x?: InstanceCallbackOrValue<LayoutNode<CMNode, PointKey>>
    width?: InstanceCallbackOrValue<LayoutNode<CMNode, PointKey>>
    paddingLeft?: ValueOrGet<number>
    paddingRight?: ValueOrGet<number>

    y?: InstanceCallbackOrValue<LayoutNode<CMNode, PointKey>>
    height?: InstanceCallbackOrValue<LayoutNode<CMNode, PointKey>>
    paddingTop?: ValueOrGet<number>
    paddingBottom?: ValueOrGet<number>

    alignSelf?: AlignSelfFun
    alignSelfX?: AlignSelfFun
    alignSelfY?: AlignSelfFun
    draw?(ctx: CanvaRenderCtx, path: Path2D): void
  }

const config: LayoutConfig<CMNode, PointKey> = {
  getLayout(m): void | LayoutNode<CMNode, keyof Point<number>> {
    return m.ext.rect
  },
  getParentLayout(m): void | LayoutNode<CMNode, keyof Point<number>> {
    return m.parent.ext.rect
  },
  getChildren(m): readonly CMNode[] {
    return m.children()
  },
}
export function hookDrawRect(n: DrawRectConfig) {
  const x = createLayoutNode(config, {
    ...n,
    axis: {
      x: {
        position: n.x,
        size: n.width,
        paddingStart: n.paddingLeft,
        paddingEnd: n.paddingRight,
        alignSelf: n.alignSelfX ?? n.alignSelf,
      },
      y: {
        position: n.y,
        size: n.height,
        paddingStart: n.paddingTop,
        paddingEnd: n.paddingBottom,
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
    draw(ctx, path) {
      path.rect(0, 0, x.axis.x.size(), x.axis.y.size())
      if (!n.draw) {
        return
      }
      const before = m._mve_canvas_render_current_rect
      m._mve_canvas_render_current_rect = x
      n.draw(ctx, path)
      m._mve_canvas_render_current_rect = before
    },
    ext: {
      ...n.ext,
      rect: x,
    },
  })

  return x
}

const m = globalThis as unknown as {
  _mve_canvas_render_current_rect: LayoutNode<CMNode, keyof Point<number>>
}

export function hookCurrentRect() {
  return m._mve_canvas_render_current_rect!
}
