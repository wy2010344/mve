// import { createNodeTempOps, } from "./util"
// import { addRender, getEnvModel, hookAddResult, hookBeginTempOps, hookEndTempOps } from "better-react"
import { BDomAttribute, DomElement, DomElementType, React } from "wy-dom-helper"
import { emptyObject } from "wy-helper"
import { domTagNames } from "wy-dom-helper"
import { NodeCreater, OrFun, StyleGetProps, StyleProps } from "./node"

const emptyKeys = ['href', 'className']
export function updateDomProps(node: any, key: string, value?: any) {
  if (key.includes('-')) {
    node.setAttribute(key, value)
  } else {
    if (emptyKeys.includes(key) && !value) {
      node[key] = ''
    } else {
      node[key] = value
    }
  }
}

function create(type: string) {
  return document.createElement(type)
}
/**
 * 静态的
 * 动态的
 */
type DomEffectAttr<T extends DomElementType> = (OrFun<BDomAttribute<T>>
  & StyleProps
  & React.DOMAttributes<DomElement<T>>)
  | (() => (BDomAttribute<T> & StyleGetProps))
type DomCreater<key extends DomElementType> = NodeCreater<key, DomElement<key>, DomEffectAttr<key>>
let dom: {
  readonly [key in DomElementType]: {
    (props?: DomEffectAttr<key>): DomCreater<key>
  }
}
if ('Proxy' in globalThis) {
  const cacheDomMap = new Map<string, any>()
  dom = new Proxy(emptyObject as any, {
    get(_target, p, _receiver) {
      const oldV = cacheDomMap.get(p as any)
      if (oldV) {
        return oldV
      }
      const newV = function (args: any) {
        const creater = NodeCreater.instance
        creater.type = p as any
        creater.create = create
        creater.updateProps = updateDomProps

        creater.attrsEffect = args
        return creater
      }
      cacheDomMap.set(p as any, newV)
      return newV
    }
  })
} else {
  const cacheDom = {} as any
  dom = cacheDom
  domTagNames.forEach(function (tag) {
    cacheDom[tag] = function (args: any) {
      const creater = NodeCreater.instance
      creater.type = tag as any
      creater.create = create
      creater.updateProps = updateDomProps

      creater.attrsEffect = args
      return creater
    }
  })
}

export {
  dom
}