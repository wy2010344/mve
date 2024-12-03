import { hookAddDestroy, hookAddResult } from "mve-core"
import { ChildAttr, diffChangeChildren, DomAttribute, getRenderChildren, OrFun, renderNodeAttr, SvgAttribute } from "mve-dom"
import { hookTrackSignal } from "mve-helper"
import { BDomEvent, BSvgEvent, DomElement, DomElementType, isSVG, SvgElement, SvgElementType } from "wy-dom-helper"
import { addEffect, asLazy, emptyArray, EmptyFun, GetValue, trackSignal, ValueOrGet, valueOrGetToGet } from "wy-helper"




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
}

type DomConfigure<T extends DomElementType> = OrFun<
  Omit<DomAttribute<T>, 's_width'
    | 's_height'
    | 's_position'
    | 's_display'
    | 's_left'
    | 's_right'
    | 's_top'
    | 's_bottom'>
> & BDomEvent<T> & ChildAttr<DomElement<T>>

type SvgConfigure<T extends SvgElementType> = OrFun<
  Omit<SvgAttribute<T>, 's_width'
    | 's_height'
    | 's_position'
    | 's_display'
    | 's_left'
    | 's_right'
    | 's_top'
    | 's_bottom'>
> & BSvgEvent<T> & ChildAttr<SvgElement<T>>

export function renderADom<T extends DomElementType>(type: T, arg: DomConfigure<T> & AbsoluteConfigure): MAbsoluteNode {
  const target = document.createElement(type)
  return renderAbsolute(target, arg, false)
}
export function renderASvg<T extends SvgElementType>(type: T, arg: SvgConfigure<T> & AbsoluteConfigure): MAbsoluteNode {
  const target = document.createElementNS("http://www.w3.org/2000/svg", type)
  return renderAbsolute(target, arg, true)
}
function renderAbsolute(target: any, c: any, svg: boolean) {

  const n = new MAbsoluteNode(target, svg, c)
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
    renderNodeAttr(n.target, n.configure, svg ? 'svg' : 'dom')
  })
  return n
}

function getTarget(n: MAbsoluteNode): Node {
  return n.target
}
class MAbsoluteNode implements AbsoluteNode<any> {
  constructor(
    public readonly target: any,
    public readonly isSVG: boolean,
    public readonly configure: any
  ) {

    this.x = valueOrGetToGet(configure.x, true)
    this.y = valueOrGetToGet(configure.y, true)
    this.width = valueOrGetToGet(configure.width, true)
    this.height = valueOrGetToGet(configure.height, true)

    if (!configure.childrenType && configure.children) {
      this.children = getRenderChildren<MAbsoluteNode, MAbsoluteNode>(() => configure.children!(this.target), this)
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