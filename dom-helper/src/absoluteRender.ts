import { hookAddDestroy, hookAddResult } from "mve-core"
import { diffChangeChildren, getRenderChildren, } from "mve-dom"
import { hookTrackSignal } from "mve-helper"
import { BDomEvent, DomElement, DomElementType, FDomAttribute, FGetChildAttr, renderFNodeAttr } from "wy-dom-helper"
import { addEffect, asLazy, Compare, createSignal, emptyArray, emptyFun, EmptyFun, GetValue, memo, PointKey, SetValue, trackSignal, trackSignalMemo, ValueOrGet, valueOrGetToGet } from "wy-helper"




type InstanceCallbackOrValue<T> = T | ((n: AbsoluteNode) => T)

interface AbsoluteParent {
  children: GetValue<AbsoluteNode[]>
  getChildInfo(x: Info, i: number): number
}
export interface AbsoluteNode<T = any> extends AbsoluteParent {
  x: GetValue<number>
  y: GetValue<number>
  width: GetValue<number>
  height: GetValue<number>
  target: T
  parent: AbsoluteParent
  index(): number
  getInfo(x: Info): number
}

interface LocationConfigure {
  x?: InstanceCallbackOrValue<number>
  y?: InstanceCallbackOrValue<number>
}

type AliasAttr<T extends DomElementType> = InOrFun<
  Omit<FDomAttribute<T>
    , 's_position'
    | 's_display'
    | 's_left'
    | 's_right'
    | 's_top'
    | 's_bottom'>
> & LocationConfigure
/**
 * 应该可以细分
 */
type DomConfigure<T extends DomElementType> =
  (Omit<AliasAttr<T>
    , 's_width'
    | 's_maxWidth'
    | 's_minWidth'
    | 's_height'
    | 's_maxHeight'
    | 's_minHeight'> & {
      width?: InstanceCallbackOrValue<number>
      height?: InstanceCallbackOrValue<number>
    })
  | (Omit<AliasAttr<T>
    , 's_width'
    | 's_maxWidth'
    | 's_minWidth'> & {
      width: 'auto'
      height?: InstanceCallbackOrValue<number>
    })
  | (Omit<AliasAttr<T>
    , 's_height'
    | 's_maxHeight'
    | 's_minHeight'> & {
      width?: InstanceCallbackOrValue<number>
      height: 'auto'
    })
  | AliasAttr<T> & {
    width: 'auto'
    height: 'auto'
  }

export function renderADom<T extends DomElementType>(
  type: T,
  arg: DomConfigure<T> & BDomEvent<T> & FGetChildAttr<DomElement<T>> & {
    m_display?: MDisplay
  }
): MAbsoluteNode {
  const target = document.createElement(type)
  target.style.position = 'absolute'
  return renderAbsolute(target, arg, false)
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
function valueInstOrGetToGet<T>(
  o: InstanceCallbackOrValue<T> | undefined,
  getIns: GetValue<MAbsoluteNode>,
  create: (getIns: GetValue<MAbsoluteNode>) => GetValue<T>,
  shouldChange?: Compare<T>
): GetValue<T> {
  const tp = typeof o
  if (tp == 'function') {
    return memo(() => {
      return (o as any)(getIns())
    }, shouldChange)
  } else if (tp == 'undefined') {
    return create(getIns)
  } else {
    return asLazy(o as T)
  }
}

type InOrFun<T extends {}> = {
  [key in keyof T]: T[key] | ((n: AbsoluteNode) => T[key])
};


type MDisplay = (n: AbsoluteNode) => {
  getInfo(x: Info): number
  /**
   * 有可能影响子节点的尺寸
   * @param x 
   * @param i 
   */
  getChildInfo(x: Info, i: number): number
}

function superCreateGet(x: Info) {
  return function (getIns: GetValue<MAbsoluteNode>) {
    return function () {
      const ins = getIns()
      try {
        //优先选择自己的,
        const ix = ins.getInfo(x)
        console.log("x", x, ix)
        return ix
      } catch (err) {
        //其次选择来自父元素的约束
        return ins.parent.getChildInfo(x, ins.index())
      }
    }
  }
}
const createGetX = superCreateGet("x")
const createGetY = superCreateGet("y")
const createGetWidth = superCreateGet("width")
const createGetHeight = superCreateGet("height")
function renderAbsolute(target: any, c: any, svg: boolean) {
  let wSet: SetValue<number> | undefined = undefined
  let hSet: SetValue<number> | undefined = undefined
  let width: GetValue<number>
  let height: GetValue<number>


  function getIns() {
    return n
  }
  const x = valueInstOrGetToGet(c.x, getIns, createGetX)
  const y = valueInstOrGetToGet(c.y, getIns, createGetY)
  if (c.width == 'auto') {
    const w = createSignal(0)
    width = w.get
    wSet = w.set
  } else {
    width = valueInstOrGetToGet(c.width, getIns, createGetWidth)
  }


  if (c.height == 'auto') {
    const h = createSignal(0)
    height = h.get
    hSet = h.set
  } else {
    height = valueInstOrGetToGet(c.height, getIns, createGetHeight)
  }

  const addDestroy = hookAddDestroy()
  if (wSet || hSet) {
    addEffect(() => {
      const cb = () => {
        wSet?.(target.clientWidth)
        hSet?.(target.clientHeight)
      }
      cb()
      const ob = new ResizeObserver(cb)
      ob.observe(target)
      addDestroy(() => {
        ob.disconnect()
      })
    }, -2)
  }


  const n = new MAbsoluteNode(
    target,
    x, y,
    width, height,
    svg,
    c)
  hookAddResult(n)
  hookTrackSignal(
    n.children as GetValue<MAbsoluteNode[]>,
    diffChangeChildren(n.target, getTarget, (child, i) => {
      child.setParentAndIndex(i, n)
    })
  )
  addEffect(() => {
    addDestroy(trackSignal(n.x, x => n.target.style.left = x + 'px'))
    addDestroy(trackSignal(n.y, x => n.target.style.top = x + 'px'))
    if (!wSet) {
      addDestroy(trackSignal(n.width, x => n.target.style.width = x + 'px'))
    }
    if (!hSet) {
      addDestroy(trackSignal(n.height, x => n.target.style.height = x + 'px'))
    }
  }, -1)
  addEffect(() => {
    function mergeValue(
      node: any, value: any, setValue: any
    ) {
      const ext = arguments[3]
      if (typeof value == 'function') {
        addDestroy(trackSignalMemo(() => value(n), setValue, node, ext))
      } else {
        setValue(value, node, ext)
      }
    }
    renderFNodeAttr(target, c, svg ? 'svg' : 'dom', mergeValue, emptyFun)
  })
  return n
}

function getTarget(n: MAbsoluteNode): Node {
  return n.target
}

class MAbsoluteNode implements AbsoluteNode<any> {
  constructor(
    public readonly target: any,
    public readonly x: GetValue<number>,
    public readonly y: GetValue<number>,
    public readonly width: GetValue<number>,
    public readonly height: GetValue<number>,
    public readonly isSVG: boolean,
    public readonly configure: any
  ) {
    const display = configure.m_display || absoluteDisplay
    const xx = display(this)
    this.getChildInfo = xx.getChildInfo
    this.getInfo = xx.getInfo
    if (!configure.childrenType && configure.children) {
      this.children = getRenderChildren<MAbsoluteNode, MAbsoluteNode>(() => configure.children!(this.target), this)
    } else {
      this.children = asLazy(emptyArray as any[])
    }
  }
  children: GetValue<AbsoluteNode[]>
  parent!: AbsoluteParent
  private _index!: number
  setParentAndIndex(
    index: number,
    parent: AbsoluteParent
  ) {
    if (!!this.parent) {
      if (this.parent != parent) {
        throw 'parent发生改变'
      }
    }
    this._index = index
    this.parent = parent
  }

  index() {
    this.parent.children()
    return this._index
  }
  getChildInfo: (x: Info, i: number) => number
  getInfo: (x: Info) => number
}

type SizeKey = "width" | "height"

type Info = SizeKey | PointKey
/**
 * 可以预计算子节点:在初始化时就可以做
 * 再顺序根踪x/y/width/height:统一做第一步
 * 再跟踪其它属性:统一做第二步
 * @param node 
 * @param children 
 */
export function renderAbsoulte(node: Node, children: EmptyFun) {
  const getChildren = getRenderChildren<MAbsoluteNode, undefined>(children, undefined)

  const parent: AbsoluteParent = {
    children: getChildren,
    getChildInfo(x, i) {
      return 0
    },
  }
  hookTrackSignal(
    getChildren as GetValue<MAbsoluteNode[]>,
    diffChangeChildren(node, getTarget, (child, i) => {
      child.setParentAndIndex(i, parent)
    })
  )
}


const absoluteDisplay: MDisplay = (n) => {
  return {
    getChildInfo(x, i) {
      //不定义子元素的坐标
      throw ''
    },
    getInfo(x) {
      if (x == 'x' || x == 'y') {
        //不定义自身的坐标
        throw ''
      }
      //自身的宽高默认是0
      return 0
    },
  }
}


export function flexDisplay({
  direction = 'y'
}: {
  direction?: ValueOrGet<PointKey>
}): MDisplay {
  const getDirection = valueOrGetToGet(direction)


  return function (n) {

    const cInfos = memo(() => {
      let length = 0
      let width = 0
      const list: number[] = [0]
      const d = getDirection()
      const s = directionToSize(d)
      const od = oppositeDirection(d)
      const os = directionToSize(od)
      n.children().forEach(child => {
        length = length + child[s]()
        list.push(
          length
        )
        width = Math.max(child[os](), width)
      })
      return {
        list,
        length,
        width
      }
    })

    return {
      getChildInfo(x, i) {
        const d = getDirection()
        const od = oppositeDirection(d)
        if (x == d) {
          const row = cInfos().list[i]
          return row
        }
        if (x == od) {
          return 0
        }
        throw ''
      },
      getInfo(x) {
        const d = getDirection()
        const s = directionToSize(d)
        const od = oppositeDirection(d)
        const os = directionToSize(od)
        if (x == s) {
          return cInfos().length
        } else if (x == os) {
          return cInfos().width
        }
        throw ''
      },
    }
  }
}
function directionToSize(x: PointKey): SizeKey {
  if (x == 'x') {
    return "width"
  } else {
    return "height"
  }
}
function oppositeDirection(x: PointKey): PointKey {
  if (x == 'x') {
    return 'y'
  } else {
    return 'x'
  }
}