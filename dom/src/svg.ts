import { BSvgAttribute, BSvgEvent, DataAttr, updateSvgProps, React, SvgElement, SvgElementType, svgTagNames } from "wy-dom-helper"
import { createOrProxy } from "wy-helper"
import { NodeCreater, StyleGetProps, StyleProps } from "./node"
import { OrFun } from "./hookChildren"


type SvgAttribute<T extends SvgElementType> = BSvgAttribute<T> & React.AriaAttributes & DataAttr

type SvgEffectAttr<T extends SvgElementType> = (OrFun<SvgAttribute<T>>
  & StyleProps
  & BSvgEvent<T>)
  | (() => (SvgAttribute<T> & StyleGetProps))




function create(type: string) {
  return document.createElementNS("http://www.w3.org/2000/svg", type)
}

type SvgCreater<key extends SvgElementType> = NodeCreater<key, SvgElement<key>, SvgEffectAttr<key>>

export const svg: {
  readonly [key in SvgElementType]: {
    (props?: SvgEffectAttr<key>): SvgCreater<key>
  }
} = createOrProxy(svgTagNames, tag => {
  return function (args: any) {
    const creater = NodeCreater.instance
    creater.type = tag as any
    creater.create = create
    creater.updateProps = updateSvgProps

    creater.attrsEffect = args
    return creater
  } as any
})