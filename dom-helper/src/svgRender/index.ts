/**
 * svg比较适合添加布局
 * 在g上面添加
 * 类似于three.js在group上添加
 */

import { hookAddDestroy } from "mve-core";
import { absoluteDisplay, emptyFun, GetValue, hookLayout, InstanceCallbackOrValue, LayoutModel, MDisplayOut, memo, Point, PointKey, valueInstOrGetToGet, ValueOrGet, valueOrGetToGet } from "wy-helper";


interface GNode {
  x: GetValue<number>
  y: GetValue<number>
  index(): number
  width: GetValue<number>
  height: GetValue<number>
  children: GetValue<readonly GNode[]>
  getExt(): any
  layoutInfo: GNodeLayoutInfo
}

interface GConfigure {
  layout?: ((v: GNodeImpl) => MDisplayOut<PointKey>) | MDisplayOut<PointKey>
  x?: InstanceCallbackOrValue<GNodeImpl>
  y?: InstanceCallbackOrValue<GNodeImpl>
  width?: InstanceCallbackOrValue<GNodeImpl>
  height?: InstanceCallbackOrValue<GNodeImpl>
  paddingLeft?: ValueOrGet<number>
  paddingRight?: ValueOrGet<number>
  paddingTop?: ValueOrGet<number>
  paddingBottom?: ValueOrGet<number>
}

class GNodeImpl implements GNode, MDisplayOut<PointKey> {
  constructor(
    readonly target: SVGElement
  ) { }
  getSizeInfo(x: keyof Point<number>, def?: boolean): number {
    throw new Error("Method not implemented.");
  }
  getChildInfo(x: keyof Point<number>, size: boolean, i: number): number {
    throw new Error("Method not implemented.");
  }
  children: GetValue<readonly GNode[]> = () => {

  }
  layoutInfo = new GNodeLayoutInfo()
}

class GNodeLayoutInfo {
  _index = 0
  _get = emptyFun

}


function superCreateGet(x: PointKey, size: boolean) {
  return function (getIns: GetValue<GNodeImpl>) {
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
const createGetX = superCreateGet("x", false)
const createGetY = superCreateGet("y", false)
const createGetWidth = superCreateGet("x", true)
const createGetHeight = superCreateGet("y", true)


function getInnerSize(
  o: InstanceCallbackOrValue<GNodeImpl> | undefined,
  getIns: GetValue<GNodeImpl>,
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
function emptyThrow(): number {
  throw 'abc'
}
export function hookSvg(
  n: GConfigure
) {
  function getIns(): GNodeImpl {
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
    const list: GNode[] = []
    node.children().forEach((child, i) => {
      if (!child.getExt().notFlex) {
        child.layoutInfo._index = list.length
        child.layoutInfo._get = children
        list.push(child.layoutInfo)
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

  const node = new GNodeImpl()
  hookAddDestroy(node.target)
}