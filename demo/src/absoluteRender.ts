import { hookAddDestroy, hookAddResult, hookAlterChildren } from "mve-core"
import { diffChangeChildren, getRenderChildren, OrFun } from "mve-dom"
import { hookTrackSignal, hookTrackSignalMemo } from "mve-helper"
import { config } from "process"
import { BDomAttribute, BDomEvent, BSvgAttribute, BSvgEvent, CSSProperties, DomElement, DomElementType, isSVG, React, SvgElement, SvgElementType } from "wy-dom-helper"
import { addEffect, asLazy, emptyArray, emptyFun, EmptyFun, GetValue, memo, trackSignal, ValueOrGet, valueOrGetToGet } from "wy-helper"
import * as CSS from 'csstype';




export type AbsoluteNode<T = any> = {
  x: GetValue<number>
  y: GetValue<number>
  width: GetValue<number>
  height: GetValue<number>
  children: GetValue<AbsoluteNode<any>[]>
  target: T
}

interface AbsoluteConfigure {
  x: ValueOrGet<number>
  y: ValueOrGet<number>
  width: ValueOrGet<number>
  height: ValueOrGet<number>
  children?(): void
}

type ACssProperties = Omit<CSS.Properties<string | number>,
  'position' | 'display' | 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'>
type BCssProperties = {
  [key in keyof ACssProperties as `s_${key}`]: ACssProperties[key]
}

type BDomAttributeC<T extends DomElementType> = Omit<BDomAttribute<T>, 'className'>

type BDomAttributeCS<T extends DomElementType> = {
  [key in keyof BDomAttributeC<T> as (key extends string ? `a_${key}` : key)]: BDomAttributeC<T>[key]
}


type BSvgAttributeC<T extends SvgElementType> = Omit<BSvgAttribute<T>, 'className'>
type BSvgAttributeCS<T extends SvgElementType> = {
  [key in keyof BSvgAttributeC<T> as (key extends string ? `a_${key}` : key)]: BSvgAttributeC<T>[key]
}

type ReplaceDashWithUnderscore<Key> = Key extends string
  ? Key extends `${infer Prefix}-${infer Suffix}`
  ? `${ReplaceDashWithUnderscore<Prefix>}_${ReplaceDashWithUnderscore<Suffix>}`
  : Key
  : Key;


type AriaAttribute = {
  [key in keyof React.AriaAttributes as ReplaceDashWithUnderscore<key>]: React.AriaAttributes[key]
}

type DomConfigure<T extends DomElementType> = {
  type: T
  className?: ValueOrGet<string>
} & OrFun<BDomAttributeCS<T>> & BDomEvent<T> & OrFun<BCssProperties> & OrFun<AriaAttribute> & OrFun<DataAttribute> & OrFun<CssVaribute>
type SvgConfigure<T extends SvgElementType> = {
  type: T
  className?: ValueOrGet<string>
} & OrFun<BSvgAttributeCS<T>> & BSvgEvent<T> & OrFun<BCssProperties> & OrFun<AriaAttribute> & OrFun<DataAttribute> & OrFun<CssVaribute>

type DataAttribute = {
  [key in `data_${string}`]?: string | number | boolean
}
type CssVaribute = {
  [key in `css_${string}`]?: string | number | boolean
}
type AllConfigure = AbsoluteConfigure & (DomConfigure<DomElementType> | SvgConfigure<SvgElementType>)
export function hookAbsolute(c: AllConfigure) {
  const n = new MAbsoluteNode(c)
  hookAddResult(n)
  hookTrackSignal(
    n.children as GetValue<MAbsoluteNode[]>,
    diffChangeChildren(n.target, getTarget, (child, i) => {
      child.setParentAndIndex(n.children, i, n)
    })
  )
  const addDestroy = hookAddDestroy()
  addEffect(() => {
    addDestroy(trackSignal(n.x, x => n.target.style.left = x + 'px'))
    addDestroy(trackSignal(n.y, x => n.target.style.top = x + 'px'))
    addDestroy(trackSignal(n.width, x => n.target.style.width = x + 'px'))
    addDestroy(trackSignal(n.height, x => n.target.style.height = x + 'px'))
  }, -1)
  addEffect(() => {
    const c = n.configure as any
    for (const key in c) {
      if (key.startsWith("s_")) {
        //style
      } else if (key.startsWith("a_")) {
        //attribute
      } else if (key.startsWith("aria_")) {
        //aria
      } else if (key.startsWith("data_")) {
        //data-attribute
      } else if (key.startsWith("css_")) {
        //css-variable
      } else if (key == 'className') {
        //className
      }
    }
  })
  return n
}

function getTarget(n: MAbsoluteNode): Node {
  return n.target
}
class MAbsoluteNode implements AbsoluteNode<any> {
  constructor(
    public readonly configure: AllConfigure
  ) {
    this.target = isSVG(configure.type)
      ? document.createElementNS("http://www.w3.org/2000/svg", configure.type)
      : document.createElement(configure.type)

    this.x = valueOrGetToGet(configure.x, true)
    this.y = valueOrGetToGet(configure.y, true)
    this.width = valueOrGetToGet(configure.width, true)
    this.height = valueOrGetToGet(configure.height, true)

    if (configure.children) {
      this.children = getRenderChildren<MAbsoluteNode, MAbsoluteNode>(configure.children, this)
    } else {
      this.children = asLazy(emptyArray as any[])
    }
    const c = configure as any
    for (let key in c) {
      if (key.startsWith("on")) {
        if (key.endsWith("Capture")) {

        } else {

        }
      }
    }
  }
  x: GetValue<number>
  y: GetValue<number>
  width: GetValue<number>
  height: GetValue<number>
  children: GetValue<AbsoluteNode[]>


  private parent?: AbsoluteNode
  private _index!: number
  private parentGetChildren!: GetValue<AbsoluteNode[]>
  setParentAndIndex(
    getChildren: () => AbsoluteNode[],
    index: number,
    parent?: AbsoluteNode
  ) {
    if (!!this.parentGetChildren) {
      if (this.parent != parent) {
        throw 'parent发生改变'
      }
      if (this.parentGetChildren != getChildren) {
        throw 'parent的children发生改变'
      }
    }
    this._index = index
    this.parent = parent
    this.parentGetChildren = getChildren
  }

  index() {
    this.parentGetChildren()
    return this._index
  }


  target: any
}

/**
 * 可以预计算子节点:在初始化时就可以做
 * 再顺序根踪x/y/width/height:统一做第一步
 * 再跟踪其它属性:统一做第二步
 * @param node 
 * @param children 
 */
export function renderAbsoulte(node: Node, children: EmptyFun) {
  const getChildren = getRenderChildren<MAbsoluteNode, undefined>(children, undefined)

  hookTrackSignal(
    getChildren as GetValue<MAbsoluteNode[]>,
    diffChangeChildren(node, getTarget, (child, i) => {
      child.setParentAndIndex(getChildren, i)

      //这里需要一边遍历,一边准备赋予相应的属性观察.但这里又是在观察中,可能需要memoKeep
      //这里只是第一层的列表,其实是涉及所有列表
      //可能需要使用effect阶段去处理.通过effect-level来处理
    })
  )
  // hookTrackSignalMemo(() => {

  //   function prepare(getChildren: GetValue<CNode[]>, parent?: CNode) {
  //     getChildren().forEach((child, i) => {
  //       child.ctx = ctx
  //       child.setParentAndIndex(getChildren, i, parent)
  //       prepare(child.beforeChildren, child)
  //       prepare(child.children, child)
  //     })
  //   }
  //   prepare(getChildren)
  // }, emptyFun)
}