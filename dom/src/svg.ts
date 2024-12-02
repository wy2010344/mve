import { BSvgAttribute, BSvgEvent, getAttributeAlias, React, SvgElement, SvgElementType, svgTagNames } from "wy-dom-helper"
import { emptyObject } from "wy-helper"
import { NodeCreater, StyleGetProps, StyleProps } from "./node"
import { updateDomProps } from "./dom"
import { OrFun } from "./hookChildren"


type SvgAttribute<T extends SvgElementType> = BSvgAttribute<T> & React.AriaAttributes

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

let svg: {
  readonly [key in SvgElementType]: {
    (props?: SvgEffectAttr<key>): SvgCreater<key>
  }
}
if ('Proxy' in globalThis) {
  const cacheSvgMap = new Map<string, any>()
  svg = new Proxy(emptyObject as any, {
    get(_target, p, _receiver) {
      const oldV = cacheSvgMap.get(p as any)
      if (oldV) {
        return oldV
      }
      const newV = function (args: any) {
        const creater = NodeCreater.instance
        creater.type = p as any
        creater.create = create
        creater.updateProps = updateSVGProps

        creater.attrsEffect = args
        return creater
      }
      cacheSvgMap.set(p as any, newV)
      return newV
    }
  })
} else {
  const cacheSvg = {} as any
  svg = cacheSvg
  svgTagNames.forEach(function (tag) {
    cacheSvg[tag] = function (args: any) {
      const creater = NodeCreater.instance
      creater.type = tag as any
      creater.create = create
      creater.updateProps = updateSVGProps

      creater.attrsEffect = args
      return creater
    }
  })
}

export {
  svg
}