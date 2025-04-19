import { CanvaRenderCtx, CMNode, CNodePathConfigure, hookDraw, PathResult, } from "./index"
import { AlignSelfFun, emptyFun, EmptyFun, GetValue, hookLayout, InstanceCallbackOrValue, LayoutModel, MDisplayOut, memo, Point, PointKey, valueInstOrGetToGet, ValueOrGet, valueOrGetToGet, absoluteDisplay } from "wy-helper"

export { simpleFlex } from 'wy-helper'


export class CanvasRectNode implements MDisplayOut<PointKey>, LayoutModel<PointKey> {
  target!: CMNode
  getExt() {
    return this.target.ext
  }
  _index: number = 0
  _get: EmptyFun = emptyFun
  index() {
    this._get()
    return this._index
  }
  constructor(
    public readonly x: GetValue<number>,
    public readonly y: GetValue<number>,
    public readonly width: GetValue<number>,
    public readonly height: GetValue<number>,
    public readonly getDisplay: GetValue<MDisplayOut<PointKey>>,
    public readonly paddingLeft: GetValue<number>,
    public readonly paddingRight: GetValue<number>,
    public readonly paddingTop: GetValue<number>,
    public readonly paddingBottom: GetValue<number>,
    public readonly drawWidth: GetValue<number>,
    public readonly drawHeight: GetValue<number>,
    readonly children: GetValue<readonly CanvasRectNode[]>
  ) { }

  getSizeInfo(x: PointKey, def?: boolean): number {
    /**布局,从子节点汇总而来 */
    const v = this.getDisplay().getSizeInfo(x, def)
    if (x == 'x') {
      return v + this.paddingLeft() + this.paddingRight()
    }
    if (x == 'y') {
      return v + this.paddingTop() + this.paddingBottom()
    }
    return v
  }
  getChildInfo(x: PointKey, size: boolean, i: number): number {
    const v = this.getDisplay().getChildInfo(x, size, i)
    if (x == 'x') {
      return v + this.paddingLeft()
    }
    if (x == 'y') {
      return v + this.paddingTop()
    }
    return v
  }

  getSize(key: keyof Point<number>): number {
    if (key == 'x') {
      return this.width()
    } else {
      return this.height()
    }
  }
  getAlign(key: keyof Point<number>): AlignSelfFun | void {
    return this.getExt().align
  }
  getGrow(): number | void {
    return this.getExt().grow
  }
  getPosition(key: keyof Point<number>): number {
    if (key == 'x') {
      return this.x()
    } else {
      return this.y()
    }
  }
}

interface AbsoluteNodeConfigure {
  layout?: ((v: CanvasRectNode) => MDisplayOut<PointKey>) | MDisplayOut<PointKey>
  x?: InstanceCallbackOrValue<CanvasRectNode>
  y?: InstanceCallbackOrValue<CanvasRectNode>
  width?: InstanceCallbackOrValue<CanvasRectNode>
  height?: InstanceCallbackOrValue<CanvasRectNode>
  paddingLeft?: ValueOrGet<number>
  paddingRight?: ValueOrGet<number>
  paddingTop?: ValueOrGet<number>
  paddingBottom?: ValueOrGet<number>
  draw?(ctx: CanvaRenderCtx, n: CanvasRectNode, p: Path2D): PathResult | void;
}
function superCreateGet(x: PointKey, size: boolean) {
  return function (getIns: GetValue<CanvasRectNode>) {
    return function () {
      const ins = getIns()
      if (size) {
        try {
          //优先选择自己的,
          const ix = ins.getSizeInfo(x)
          return ix
        } catch (err) {
          try {
            return getFromParent(ins, x, size, err)
          } catch (err) {
            return ins.getSizeInfo(x, true)
          }
        }
      } else {
        try {
          return getFromParent(ins, x, size, 'define')
        } catch (err) {
          return 0
        }
      }
    }
  }
}

function getFromParent(
  ins: CanvasRectNode,
  x: PointKey,
  size: boolean,
  err: any) {
  const parent = ins.target.parent.ext.rect
  if (parent && parent instanceof CanvasRectNode) {
    // if (ins.target.isBefore) {
    //   return parent.getBeforeChildInfo(x, ins.target.index())
    // }
    return parent.getChildInfo(x, size, ins.index())
  }
  //其次选择来自父元素的约束
  throw err
}

const createGetX = superCreateGet("x", false)
const createGetY = superCreateGet("y", false)
const createGetWidth = superCreateGet("x", true)
const createGetHeight = superCreateGet("y", true)

function emptyThrow(): number {
  throw 'abc'
}

function getInnerSize(
  o: InstanceCallbackOrValue<CanvasRectNode> | undefined,
  getIns: GetValue<CanvasRectNode>,
  key: PointKey,
  left: GetValue<number>,
  right: GetValue<number>
): GetValue<number> {
  const tp = typeof o
  if (tp == 'undefined') {
    return function () {
      return getFromParent(getIns(), key, true, '') - left() - right()
    }
  } else if (tp == 'number') {
    return function () {
      return (o as number) - left() - right()
    }
  } else if (tp == 'function') {
    return function () {
      return (o as any)(getIns()) - left() - right()
    }
  } else {
    return emptyThrow
  }
}
export type DrawRectConfig = AbsoluteNodeConfigure & Omit<CNodePathConfigure, 'x' | 'y' | 'draw' | 'withPath'>
export function hookDrawRect(
  n: DrawRectConfig) {
  function getIns(): CanvasRectNode {
    return node
  }
  const _layout = valueOrGetToGet(n.layout || absoluteDisplay)

  const x = valueInstOrGetToGet(n.x, getIns, createGetX)
  const y = valueInstOrGetToGet(n.y, getIns, createGetY)
  const width = valueInstOrGetToGet(n.width, getIns, createGetWidth)
  const height = valueInstOrGetToGet(n.height, getIns, createGetHeight)
  const paddingLeft = valueOrGetToGet(n.paddingLeft || 0)
  const paddingRight = valueOrGetToGet(n.paddingRight || 0)
  const paddingTop = valueOrGetToGet(n.paddingTop || 0)
  const paddingBottom = valueOrGetToGet(n.paddingBottom || 0)

  const drawWidth = getInnerSize(
    n.width, getIns, 'x', paddingLeft, paddingRight)
  const drawHeight = getInnerSize(
    n.height, getIns, 'y', paddingTop, paddingBottom)

  const children = memo(() => {
    //生成复合结构,所以用memo
    const list: CanvasRectNode[] = []
    tnode.children().forEach((child, i) => {
      const rect = child.ext.rect
      if (rect instanceof CanvasRectNode && !rect.getExt().notFlex) {
        rect._index = list.length
        rect._get = children
        list.push(rect)
      }
    })
    return list
  })
  const info = {
    getSize(n: PointKey) {
      if (n == 'x') {
        return drawWidth()
      } else {
        return drawHeight()
      }
    },
    children
  }
  const layout: GetValue<MDisplayOut<PointKey>> = memo(() => {
    //生成复全结构,所以用memo
    return hookLayout(info, _layout)
  })
  const node = new CanvasRectNode(
    x, y,
    width,
    height,
    layout,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    drawWidth,
    drawHeight,
    info.children
  )
  const tnode = hookDraw({
    ...n,
    x,
    y,
    withPath: true,
    draw(ctx, path) {
      /**
       * @todo 加上圆角
       */
      path.rect(0, 0, node.width(), node.height())
      return n.draw?.(ctx, node, path)
    },
    ext: {
      ...n.ext,
      rect: node
    }
  })
  node.target = tnode
  return node
}