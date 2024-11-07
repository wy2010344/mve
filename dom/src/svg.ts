import { BSvgAttribute, getAttributeAlias, React, SvgElement, SvgElementType, svgTagNames } from "wy-dom-helper"
import { emptyObject } from "wy-helper"
import { NodeCreater, OrFun, StyleGetProps, StyleProps } from "./node"
import { updateDomProps } from "./dom"


type SvgEffectAttr<T extends SvgElementType> = (OrFun<BSvgAttribute<T>>
  & StyleProps
  & React.DOMAttributes<SvgElement<T>>)
  | (() => (BSvgAttribute<T> & StyleGetProps))


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
    (props?: SvgEffectAttr<key>, isPortal?: boolean): SvgCreater<key>
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
      const newV = function (args: any, isPortal: any) {
        const creater = NodeCreater.instance
        creater.type = p as any
        creater.create = create
        creater.updateProps = updateSVGProps

        creater.attrsEffect = args
        creater.portal = isPortal
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
    cacheSvg[tag] = function (args: any, isPortal: any) {
      const creater = NodeCreater.instance
      creater.type = tag as any
      creater.create = create
      creater.updateProps = updateSVGProps

      creater.attrsEffect = args
      creater.portal = isPortal
      return creater
    }
  })
}

export {
  svg
}