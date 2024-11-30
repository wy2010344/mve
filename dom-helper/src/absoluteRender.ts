import { hookAddResult, hookAlterChildren } from "mve-core"
import { diffChangeChildren, getRenderChildren, OrFun } from "mve-dom"
import { hookTrackSignal, hookTrackSignalMemo } from "mve-helper"
import { config } from "process"
import { BDomAttribute, BSvgAttribute, CSSProperties, DomElement, DomElementType, isSVG, React, SvgElement, SvgElementType } from "wy-dom-helper"
import { asLazy, emptyArray, emptyFun, EmptyFun, GetValue, memo, ValueOrGet, valueOrGetToGet } from "wy-helper"





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

type ACssProperties = Omit<CSSProperties, 'position' | 'display' | 'left' | 'right' | 'top' | 'bottom'>
type StyleProps = {
  style?: GetValue<ACssProperties> | OrFun<ACssProperties>;
};

type DomConfigure<T extends DomElementType> = {
  type: T
  attrs?: GetValue<BDomAttribute<T>> | OrFun<BDomAttribute<T>>
  style?: StyleProps
} & React.DOMAttributes<DomElement<T>>

type SvgConfigure<T extends SvgElementType> = {
  type: T
  attrs?: GetValue<BSvgAttribute<T>> | OrFun<BSvgAttribute<T>>
  style?: StyleProps
} & React.DOMAttributes<SvgElement<T>>

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