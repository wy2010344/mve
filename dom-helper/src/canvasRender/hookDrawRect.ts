import { AlignSelfFun, InstanceCallbackOrValue, PointKey, ValueOrGet } from "wy-helper"
import { LayoutNodeConfigure, LayoutNode, createLayoutNode } from "wy-helper"
import { CanvaRenderCtx, CMNode, CNodePathConfigure, hookDraw, PathResult } from "./hookDraw"
export { simpleFlex } from 'wy-helper'

export type DrawRectConfig =
  Omit<LayoutNodeConfigure<CMNode, PointKey>, 'axis'>
  & Omit<CNodePathConfigure, 'x' | 'y' | 'draw' | 'withPath'>
  & {

    x?: InstanceCallbackOrValue<LayoutNode<CMNode, PointKey>>,
    width?: InstanceCallbackOrValue<LayoutNode<CMNode, PointKey>>,
    paddingLeft?: ValueOrGet<number>
    paddingRight?: ValueOrGet<number>


    y?: InstanceCallbackOrValue<LayoutNode<CMNode, PointKey>>,
    height?: InstanceCallbackOrValue<LayoutNode<CMNode, PointKey>>,
    paddingTop?: ValueOrGet<number>
    paddingBottom?: ValueOrGet<number>

    alignSelf?: AlignSelfFun
    alignSelfX?: AlignSelfFun
    alignSelfY?: AlignSelfFun
    draw?(ctx: CanvaRenderCtx, n: LayoutNode<CMNode, PointKey>, path: Path2D): PathResult | void
  }
export function hookDrawRect(
  n: DrawRectConfig
) {

  const x = createLayoutNode({
    ...n,
    axis: {
      x: {
        position: n.x,
        size: n.width,
        paddingStart: n.paddingLeft,
        paddingEnd: n.paddingRight,
        alignSelf: n.alignSelfX || n.alignSelf
      },
      y: {
        position: n.y,
        size: n.height,
        paddingStart: n.paddingTop,
        paddingEnd: n.paddingBottom,
        alignSelf: n.alignSelfY || n.alignSelf
      }
    }
  })
  x.target = hookDraw({
    ...n,
    x: x.axis.x.position,
    y: x.axis.y.position,
    withPath: true,
    draw(ctx, path) {
      path.rect(0, 0, x.axis.x.size(), x.axis.y.size())
      return n.draw?.(ctx, x, path)
    },
    ext: {
      ...n.ext,
      rect: x
    }
  })
  return x
}