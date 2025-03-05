import { createContext, hookAddDestroy, hookAddResult, renderStateHolder } from "mve-core"
import { diffChangeChildren, getRenderChildren } from "mve-dom"
import { hookTrackSignal } from "mve-helper"
import { BDomEvent, DomElement, DomElementType, domTagNames, FDomAttribute, FGetChildAttr, renderFDomAttr, renderFSvgAttr } from "wy-dom-helper"
import { addEffect, asLazy, batchSignalEnd, createSignal, emptyArray, emptyFun, EmptyFun, GetValue, hookLayout, memo, SetValue, trackSignal, ValueOrGet, valueOrGetToGet } from "wy-helper"
import { LayoutKey, InstanceCallbackOrValue, MDisplayOut, LayoutModel, valueInstOrGetToGet, createOrProxy } from "wy-helper"


interface AbsoluteParent {
  children: GetValue<AbsoluteNode[]>
  getChildInfo(x: LayoutKey, i: number): number
}
export interface AbsoluteNode<T = any> extends AbsoluteParent, LayoutModel {
  target: T
  parent: AbsoluteParent
  index(): number
  getInfo(x: LayoutKey, def?: boolean): number
}


type AliasAttr<T extends DomElementType> = InOrFun<
  Omit<FDomAttribute<T>
    , 's_position'
    | 's_display'
    | 's_left'
    | 's_right'
    | 's_top'
    | 's_bottom'>
>
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
      width?: InstanceCallbackOrValue<AbsoluteNode<DomElement<T>>>
      height?: InstanceCallbackOrValue<AbsoluteNode<DomElement<T>>>
    })
  | (Omit<AliasAttr<T>
    , 's_width'
    | 's_maxWidth'
    | 's_minWidth'> & {
      width: 'auto'
      height?: InstanceCallbackOrValue<AbsoluteNode<DomElement<T>>>
    })
  | (Omit<AliasAttr<T>
    , 's_height'
    | 's_maxHeight'
    | 's_minHeight'> & {
      width?: InstanceCallbackOrValue<AbsoluteNode<DomElement<T>>>
      height: 'auto'
    })
  | AliasAttr<T> & {
    width: 'auto'
    height: 'auto'
  }

export type ADomAttributes<T extends DomElementType> = DomConfigure<T> & BDomEvent<T> & FGetChildAttr<DomElement<T>> & {
  m_display?: ValueOrGet<MDisplayOut>
} & {
  x?: InstanceCallbackOrValue<AbsoluteNode<DomElement<T>>>
  y?: InstanceCallbackOrValue<AbsoluteNode<DomElement<T>>>
}
export function renderADom<T extends DomElementType>(
  type: T,
  arg: ADomAttributes<T>
): MAbsoluteNode {
  const target = document.createElement(type)
  target.style.position = 'absolute'
  target.style.minWidth = '0px'
  return renderAbsolute(target, arg, false)
}

export const adom: {
  readonly [key in DomElementType]: {
    (props?: ADomAttributes<key>): DomElement<key>
  }
} = createOrProxy(domTagNames, tag => {
  return function (args: any) {
    return renderADom(tag, args)
  } as any
})


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

type InOrFun<T extends {}> = {
  [key in keyof T]: T[key] | ((n: AbsoluteNode) => T[key])
};

function superCreateGet(x: LayoutKey) {
  return function (getIns: GetValue<MAbsoluteNode>) {
    return function () {
      const ins = getIns()
      try {
        //优先选择自己的,
        const ix = ins.getInfo(x)
        return ix
      } catch (err) {
        try {
          //其次选择来自父元素的约束
          return ins.parent.getChildInfo(x, ins.index())
        } catch (err) {
          return ins.getInfo(x, true)
        }
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
  function getIns(): MAbsoluteNode {
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
        batchSignalEnd()
      }
      cb()
      const ob = new ResizeObserver(cb)
      ob.observe(target)
      addDestroy(() => {
        ob.disconnect()
      })
      // console.log("eff-2")
    }, -2)
  }


  const n = new MAbsoluteNode(
    target,
    x, y,
    width,
    height,
    svg,
    c)
  hookAddResult(n)
  if (!c.childrenType && c.children) {
    n.children = makeIndex(c.children, n.target, n)
  } else {
    n.children = asLazy(emptyArray as any[])
  }
  addEffect(() => {
    addDestroy(trackSignal(n.x, x => n.target.style.left = x + 'px'))
    addDestroy(trackSignal(n.y, x => n.target.style.top = x + 'px'))
    if (!wSet) {
      addDestroy(trackSignal(n.width, x => n.target.style.width = x + 'px'))
    }
    if (!hSet) {
      addDestroy(trackSignal(n.height, x => n.target.style.height = x + 'px'))
    }
    // console.log("eff-1")
  }, -1)
  addEffect(() => {
    function mergeValue(
      node: any, value: any, setValue: any
    ) {
      const ext = arguments[3]
      if (typeof value == 'function') {
        addDestroy(trackSignal(() => value(n), setValue, node, ext))
      } else {
        setValue(value, node, ext)
      }
    }
    if (svg) {
      renderFSvgAttr(target, c, mergeValue, emptyFun, emptyArray)
    } else {
      renderFDomAttr(target, c, mergeValue, emptyFun, emptyArray)
    }

    // console.log("eff-0")
  })
  return n
}

function getTarget(n: MAbsoluteNode): Node {
  return n.target
}

/**
 * 动态返回某一种布局,比如flex或absolute
 * 真实布局与节点结合
 */
class MAbsoluteNode implements AbsoluteNode<any> {
  private display: GetValue<MDisplayOut>
  constructor(
    public readonly target: any,
    public readonly x: GetValue<number>,
    public readonly y: GetValue<number>,
    public readonly width: GetValue<number>,
    public readonly height: GetValue<number>,
    public readonly isSVG: boolean,
    public readonly configure: any
  ) {
    const MDisplay = valueOrGetToGet(configure.m_display || absoluteDisplay)
    this.display = memo(() => {
      return hookLayout(this, MDisplay)
    })
  }
  getExt(): Record<string, any> {
    return this.configure
  }
  children!: GetValue<AbsoluteNode[]>
  parent!: AbsoluteParent
  __index!: number
  index() {
    this.parent.children()
    return this.__index
  }
  getChildInfo(x: LayoutKey, i: number) {
    return this.display().getChildInfo(x, i)
  }
  getInfo(x: LayoutKey, def?: boolean) {
    return this.display().getInfo(x, def)
  }
}
/**
 * 可以预计算子节点:在初始化时就可以做
 * 再顺序根踪x/y/width/height:统一做第一步
 * 再跟踪其它属性:统一做第二步
 * @param node 
 * @param children 
 */
export function renderAbsoulte(node: Node, children: EmptyFun) {
  const parent: AbsoluteNode = {} as any
  parent.getChildInfo = () => {
    return 0
  }
  parent.children = makeIndex(children, node, parent)
}
function makeIndex(children: EmptyFun, node: Node, parent: AbsoluteParent) {
  const getChildren = getRenderChildren<MAbsoluteNode, AbsoluteParent>(children, parent, list => {
    list.forEach((row, i) => {
      row.__index = i
      if (row.parent && row.parent != parent) {
        console.log("parent发生改变", row.parent, parent)
      }
      row.parent = parent
    })
  })
  hookTrackSignal(getChildren, diffChangeChildren(node, getTarget))
  return getChildren
}
export const absoluteDisplay: MDisplayOut = {
  getChildInfo(x, i) {
    //不定义子元素的坐标
    throw ''
  },
  getInfo(x, def) {
    if (def) {
      return 0
    }
    if (x == 'x' || x == 'y') {
      //不定义自身的坐标
      throw ''
    }
    //自身的宽高默认是0
    return 0
  },
}

