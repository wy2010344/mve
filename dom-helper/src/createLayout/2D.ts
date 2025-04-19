import { AlignSelfFun, emptyFun, EmptyFun, GetValue, hookLayout, InstanceCallbackOrValue, LayoutModel, MDisplayOut, memo, Point, PointKey, valueInstOrGetToGet, ValueOrGet, valueOrGetToGet, absoluteDisplay, alawaysFalse, objectMap } from "wy-helper"
export { simpleFlex } from 'wy-helper'

/**
 * 不太对.矩形区域本质上相当于g、group只管布局.在布局之下,有默认的视图?
 * 即布局本身确实需要依附一个节点存在
 */
export class CanvasRectNode<M, K extends string> implements MDisplayOut<K>, LayoutModel<K> {
  target!: M
  // getExt() {
  //   return this.target.ext
  // }
  _index: number = 0
  _get: EmptyFun = emptyFun
  index() {
    this._get()
    return this._index
  }
  constructor(
    readonly getDisplay: GetValue<MDisplayOut<K>>,
    readonly axis: Record<K, {
      position: GetValue<any>;
      size: GetValue<any>;
      paddingStart: GetValue<number>;
      paddingEnd: GetValue<number>;
      drawSize: GetValue<number>;
    }>,
    // readonly x: GetValue<number>,
    // readonly y: GetValue<number>,
    // readonly width: GetValue<number>,
    // readonly height: GetValue<number>,
    // readonly paddingLeft: GetValue<number>,
    // readonly paddingRight: GetValue<number>,
    // readonly paddingTop: GetValue<number>,
    // readonly paddingBottom: GetValue<number>,
    // readonly drawWidth: GetValue<number>,
    // readonly drawHeight: GetValue<number>,
    readonly children: GetValue<readonly CanvasRectNode<M, K>[]>,
    readonly getNotInLayout: GetValue<boolean>,
    readonly getGrow: GetValue<number | void>,
    readonly alignSelf?: AlignSelfFun,
  ) { }

  /**通过布局获得的信息 */
  getSizeInfo(x: K, def?: boolean): number {
    /**布局,从子节点汇总而来 */
    const v = this.getDisplay().getSizeInfo(x, def)
    const av = this.axis[x]
    return v + av.paddingStart() + av.paddingEnd()
  }
  getChildInfo(x: K, size: boolean, i: number): number {
    const v = this.getDisplay().getChildInfo(x, size, i)
    if (size) {
      return v
    }
    const av = this.axis[x]
    return v + av.paddingStart()
  }

  /**为作为flex提供的节点 */
  getSize(x: K): number {
    const av = this.axis[x]
    return av.size()
  }
  getAlign(key: K): AlignSelfFun | void {
    return this.alignSelf
  }
  getPosition(x: K): number {
    const av = this.axis[x]
    return av.position()
  }
}

export interface AbsoluteNodeConfigure<M, K extends string> {
  layout?: ((v: CanvasRectNode<M, K>) => MDisplayOut<K>) | MDisplayOut<K>

  axis: Record<K, {
    position: InstanceCallbackOrValue<CanvasRectNode<M, K>>,
    size?: InstanceCallbackOrValue<CanvasRectNode<M, K>>,
    paddingStart?: ValueOrGet<number>
    paddingEnd?: ValueOrGet<number>
  }>
  // x?: 
  // y?: InstanceCallbackOrValue<CanvasRectNode<M,K>>
  // width?: InstanceCallbackOrValue<CanvasRectNode<M,K>>
  // height?: InstanceCallbackOrValue<CanvasRectNode<M,K>>
  // paddingLeft?: ValueOrGet<number>
  // paddingRight?: ValueOrGet<number>
  // paddingTop?: ValueOrGet<number>
  // paddingBottom?: ValueOrGet<number>

  render(n: CanvasRectNode<M, K>): M
  alignSelf?: AlignSelfFun
  grow?: ValueOrGet<number>
  notInLayout?: ValueOrGet<boolean>
}

export interface RealTarget<K extends string> {
  getParentLayout(): CanvasRectNode<RealTarget<K>, K> | void
  children: GetValue<readonly RealTarget<K>[]>
  getLayout(): CanvasRectNode<RealTarget<K>, K>
}
/**
 * 没有显式定义的时候,如何取值.
 * @param x 
 * @param size 
 * @returns 
 */
function superCreateGet<M extends RealTarget<K>, K extends string>(size: boolean) {
  return function (getIns: GetValue<CanvasRectNode<M, K>>, x: K) {
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

function getFromParent<M extends RealTarget<K>, K extends string>(
  ins: CanvasRectNode<M, K>,
  x: K,
  size: boolean,
  err: any) {
  if (ins.getNotInLayout()) {
    throw err
  }
  const parent = ins.target.getParentLayout()
  if (parent && parent instanceof CanvasRectNode) {
    return parent.getChildInfo(x, size, ins.index())
  }
  //其次选择来自父元素的约束
  throw err
}

const createGetPosition = superCreateGet(false)
const createGetSize = superCreateGet(true)

function emptyThrow(): number {
  throw 'abc'
}

function getInnerSize<M extends RealTarget<K>, K extends string>(
  o: InstanceCallbackOrValue<CanvasRectNode<M, K>> | undefined,
  getIns: GetValue<CanvasRectNode<M, K>>,
  key: K,
  begin: GetValue<number>,
  end: GetValue<number>
): GetValue<number> {
  const tp = typeof o
  if (tp == 'undefined') {
    return function () {
      return getFromParent(getIns(), key, true, '') - begin() - end()
    }
  } else if (tp == 'number') {
    return function () {
      return (o as number) - begin() - end()
    }
  } else if (tp == 'function') {
    return function () {
      return (o as any)(getIns()) - begin() - end()
    }
  } else {
    return emptyThrow
  }
}
// export type DrawRectConfig = AbsoluteNodeConfigure // & Omit<CNodePathConfigure, 'x' | 'y' | 'draw' | 'withPath'>
export function createRect<M extends RealTarget<K>, K extends string>(
  n: AbsoluteNodeConfigure<M, K>
) {
  function getIns(): CanvasRectNode<M, K> {
    return node
  }
  const _layout = valueOrGetToGet(n.layout || absoluteDisplay)

  const axis = objectMap(n.axis, function (v, key) {
    const size = valueInstOrGetToGet(v.size, getIns, createGetSize, key)
    const paddingStart = valueOrGetToGet(v.paddingStart || 0)
    const paddingEnd = valueOrGetToGet(v.paddingEnd || 0)
    return {
      position: valueInstOrGetToGet(v.position, getIns, createGetPosition, key),
      size,
      paddingStart,
      paddingEnd,
      drawSize: getInnerSize(
        v.size, getIns, key,
        paddingStart, paddingEnd)
    }
  })

  // const x = valueInstOrGetToGet(n.x, getIns, createGetX)
  // const y = valueInstOrGetToGet(n.y, getIns, createGetY)
  // const width = valueInstOrGetToGet(n.width, getIns, createGetWidth)
  // const height = valueInstOrGetToGet(n.height, getIns, createGetHeight)
  // const paddingLeft = valueOrGetToGet(n.paddingLeft || 0)
  // const paddingRight = valueOrGetToGet(n.paddingRight || 0)
  // const paddingTop = valueOrGetToGet(n.paddingTop || 0)
  // const paddingBottom = valueOrGetToGet(n.paddingBottom || 0)

  // const drawWidth =
  // const drawHeight = getInnerSize(
  //   n.height, getIns, 'y',
  //   paddingTop, paddingBottom)



  const children = memo(() => {
    //生成复合结构,所以用memo
    const list: CanvasRectNode<M, K>[] = []
    tnode.children().forEach((child, i) => {
      const rect = child.getLayout() as CanvasRectNode<M, K>
      if (rect instanceof CanvasRectNode && !rect.getNotInLayout()) {
        rect._index = list.length
        rect._get = children
        list.push(rect)
      }
    })
    return list
  })
  const info = {
    getSize(n: K) {
      return axis[n].drawSize()
    },
    children
  }
  const layout: GetValue<MDisplayOut<K>> = memo(() => {
    //生成复全结构,所以用memo
    return hookLayout(info, _layout)
  })
  const node = new CanvasRectNode<M, K>(
    layout,
    axis,
    // x,
    // y,
    // width,
    // height,
    // layout,
    // paddingLeft,
    // paddingRight,
    // paddingTop,
    // paddingBottom,
    // drawWidth,
    // drawHeight,
    info.children,
    valueOrGetToGet(n.notInLayout || false),
    valueOrGetToGet(n.grow),
    n.alignSelf,
  )
  const tnode = n.render(node)
  node.target = tnode
  return node
}