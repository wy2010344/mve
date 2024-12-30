import { CanvaRenderCtx, CMNode, CNodeConfigure, hookDraw, PathResult, } from "mve-dom-helper"
import { DisplayProps, flexDisplayUtil, GetValue, hookLayout, InstanceCallbackOrValue, LayoutKey, LayoutModel, MDisplayOut, memo, valueInstOrGetToGet, ValueOrGet, valueOrGetToGet } from "wy-helper"



interface CDisplay extends MDisplayOut {
  getBeforeChildInfo(x: LayoutKey, i: number): number
}


class AbsoluteNode implements CDisplay {
  target!: CMNode
  getExt() {
    return this.target.ext
  }
  constructor(
    public readonly x: GetValue<number>,
    public readonly y: GetValue<number>,
    public readonly width: GetValue<number>,
    public readonly height: GetValue<number>,
    public readonly getDisplay: GetValue<CDisplay>,
    public readonly paddingLeft: GetValue<number>,
    public readonly paddingRight: GetValue<number>,
    public readonly paddingTop: GetValue<number>,
    public readonly paddingBottom: GetValue<number>,
    public readonly drawWidth: GetValue<number>,
    public readonly drawHeight: GetValue<number>,
  ) { }

  getInfo(x: LayoutKey): number {
    /**布局,从子节点汇总而来 */
    const v = this.getDisplay().getInfo(x)
    if (x == 'width') {
      return v + this.paddingLeft() + this.paddingRight()
    }
    if (x == 'height') {
      return v + this.paddingTop() + this.paddingBottom()
    }
    return v
  }
  getChildInfo(x: LayoutKey, i: number): number {
    const v = this.getDisplay().getChildInfo(x, i)
    if (x == 'x') {
      return v + this.paddingLeft()
    }
    if (x == 'y') {
      return v + this.paddingTop()
    }
    return v
  }
  getBeforeChildInfo(x: LayoutKey, i: number): number {
    return this.getDisplay().getBeforeChildInfo(x, i)
  }
}

interface AbsoluteNodeConfigure {
  layout?: ((v: AbsoluteNode) => CDisplay) | CDisplay
  x?: InstanceCallbackOrValue<AbsoluteNode>
  y?: InstanceCallbackOrValue<AbsoluteNode>
  width?: InstanceCallbackOrValue<AbsoluteNode>
  height?: InstanceCallbackOrValue<AbsoluteNode>
  paddingLeft?: ValueOrGet<number>
  paddingRight?: ValueOrGet<number>
  paddingTop?: ValueOrGet<number>
  paddingBottom?: ValueOrGet<number>
  draw?(ctx: CanvaRenderCtx, n: AbsoluteNode): PathResult | void;
}
function superCreateGet(x: LayoutKey) {
  return function (getIns: GetValue<AbsoluteNode>) {
    return function () {
      const ins = getIns()
      try {
        //优先选择自己的,
        const ix = ins.getInfo(x)
        return ix
      } catch (err) {
        return getFromParent(ins, x, err)
      }
    }
  }
}

function getFromParent(ins: AbsoluteNode, x: LayoutKey, err: any) {
  const parent = ins.target.parent.ext.rect
  if (parent && parent instanceof AbsoluteNode) {
    if (ins.target.isBefore) {
      return parent.getBeforeChildInfo(x, ins.target.index())
    }
    return parent.getChildInfo(x, ins.target.index())
  }
  //其次选择来自父元素的约束
  throw err
}

const createGetX = superCreateGet("x")
const createGetY = superCreateGet("y")
const createGetWidth = superCreateGet("width")
const createGetHeight = superCreateGet("height")

function emptyThrow(): number {
  throw 'abc'
}

function getInnerSize(
  o: InstanceCallbackOrValue<AbsoluteNode> | undefined,
  getIns: GetValue<AbsoluteNode>,
  key: LayoutKey,
  left: GetValue<number>,
  right: GetValue<number>
): GetValue<number> {
  const tp = typeof o
  if (tp == 'undefined') {
    return function () {
      return getFromParent(getIns(), key, '')
    }
  } else if (tp == 'number') {
    return function () {
      return (o as number) - left() - right()
    }
  } else {
    return emptyThrow
  }
}
export type DrawRectConfig = AbsoluteNodeConfigure & Omit<CNodeConfigure, 'x' | 'y' | 'draw'>
export function hookDrawRect(
  n: DrawRectConfig) {
  function getIns(): AbsoluteNode {
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

  const drawWidth = getInnerSize(n.width, getIns, 'width', paddingLeft, paddingRight)
  const drawHeight = getInnerSize(n.height, getIns, 'height', paddingTop, paddingBottom)
  const info = {
    width: drawWidth,
    height: drawHeight,
    children: memo(() => {
      const list: LayoutModel[] = []
      tnode.children().forEach(child => {
        const rect = child.ext.rect
        if (rect instanceof AbsoluteNode) {
          list.push(rect)
        }
      })
      return list
    })
  }
  const layout: GetValue<CDisplay> = memo(() => {
    return hookLayout(info, _layout)
  })
  const node = new AbsoluteNode(
    x, y, width, height, layout,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    drawWidth,
    drawHeight
  )
  const tnode = hookDraw({
    ...n,
    x,
    y,
    draw(ctx) {
      return n.draw?.(ctx, node)
    },
    ext: {
      ...n.ext,
      rect: node
    }
  })
  node.target = tnode
  return node
}

const absoluteDisplay: CDisplay = {
  getBeforeChildInfo(x, i) {
    throw 'x'
  },
  getChildInfo(x, i) {
    throw 'xx'
  },
  getInfo(x) {
    throw 'vvv'
  },

}

export function simpleFlex(props: DisplayProps): CDisplay {
  const flex = flexDisplayUtil(props)
  return {
    getBeforeChildInfo(x, i) {
      throw 'ddd'
    },
    getChildInfo: flex.getChildInfo,
    getInfo: flex.getInfo,
  }
}