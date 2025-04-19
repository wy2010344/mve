import { AbsoluteNodeConfigure, CanvasRectNode, createRect } from "../createLayout/2D"
import { CanvaRenderCtx, CMNode, CNodePathConfigure, hookDraw, PathResult } from "./hookDraw"
export { simpleFlex } from 'wy-helper'

export type DrawRectConfig = Omit<AbsoluteNodeConfigure<CMNode>, 'render'>
  & Omit<CNodePathConfigure, 'x' | 'y' | 'draw' | 'withPath'>
  & {
    draw?(ctx: CanvaRenderCtx, n: CanvasRectNode<CMNode>, path: Path2D): PathResult | void
  }
export function hookDrawRect(
  n: DrawRectConfig
) {

  return createRect({
    ...n,
    render(x) {
      return hookDraw({
        ...n,
        x: x.x,
        y: x.y,
        withPath: true,
        draw(ctx, path) {
          path.rect(0, 0, x.width(), x.height())
          return n.draw?.(ctx, x, path)
        },
        ext: {
          ...n.ext,
          rect: x
        }
      })
    },
  })
}