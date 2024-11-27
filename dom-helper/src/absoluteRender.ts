import { hookAddResult, hookAlterChildren } from "mve-core"
import { getRenderChildren, OrFun } from "mve-dom"
import { hookTrackSignalMemo } from "mve-helper"
import { BDomAttribute, BSvgAttribute, CSSProperties, DomElement, DomElementType, React, SvgElement, SvgElementType } from "wy-dom-helper"
import { asLazy, emptyArray, EmptyFun, GetValue, memo, ValueOrGet, valueOrGetToGet } from "wy-helper"





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
  return n
}

class MAbsoluteNode implements AbsoluteNode<any> {
  constructor(
    public readonly configure: AllConfigure
  ) {
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
  children: GetValue<AbsoluteNode<any>[]>
  target: any
}


export function renderAbsoulte(node: Node, children: EmptyFun) {
  const getChildren = getRenderChildren<MAbsoluteNode, undefined>(children, undefined)
  // hookTrackSignalMemo(() => {

  // })
}