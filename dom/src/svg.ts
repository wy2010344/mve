import { BSvgAttribute, BSvgEvent, DataAttr, getAttributeAlias, React, SvgElement, SvgElementType, svgTagNames } from "wy-dom-helper"
import { createOrProxy, emptyObject } from "wy-helper"
import { NodeCreater, StyleGetProps, StyleProps } from "./node"
import { updateDomProps } from "./dom"
import { OrFun } from "./hookChildren"


type SvgAttribute<T extends SvgElementType> = BSvgAttribute<T> & React.AriaAttributes & DataAttr

type SvgEffectAttr<T extends SvgElementType> = (OrFun<SvgAttribute<T>>
  & StyleProps
  & BSvgEvent<T>)
  | (() => (SvgAttribute<T> & StyleGetProps))


export function updateSVGProps(node: any, key: string, value?: any) {
  if (key == 'innerHTML' || key == 'textContent') {
    updateDomProps(node, key, value)
  } else {
    if (key == 'className') {
      node.setAttribute('class', value || '')
    } else {
      key = getAttributeAlias(key)
      if (value) {
        node.setAttribute(key, value)
      } else {
        node.removeAttribute(key)
      }
    }
  }
}


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
    creater.updateProps = updateSVGProps

    creater.attrsEffect = args
    return creater
  } as any
})