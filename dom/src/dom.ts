// import { createNodeTempOps, } from "./util"
// import { addRender, getEnvModel, hookAddResult, hookBeginTempOps, hookEndTempOps } from "better-react"
import { BDomAttribute, DomElement, DomElementType, React } from "wy-dom-helper"
import { emptyFun, emptyObject, genTemplateStringS2, genTemplateStringS1, objectDiffDeleteKey, VType, vTypeisGetValue, GetValue } from "wy-helper"
import { domTagNames } from "wy-dom-helper"
import { hookBuildChildren } from "./hookChildren"
import { hookTrackSignal } from "mve-helper"
import { hookAddResult } from "mve-core"

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


export function mergeToContent(ts: TemplateStringsArray, vs: VType[], node: any, key: string) {
  if (vs.some(vTypeisGetValue)) {
    let oldContent = ''
    hookTrackSignal(() => genTemplateStringS2(ts, vs), content => {
      if (content != oldContent) {
        node[key] = content
      }
    })
  } else {
    node[key] = genTemplateStringS1(ts, vs as string[])
  }
}

export function mergeToContent1(v: VType, node: any, key: string) {
  if (vTypeisGetValue(v)) {
    let oldContent = ''
    hookTrackSignal(v, content => {
      if (content != oldContent) {
        node[key] = content
      }
    })
  } else {
    node[key] = v
  }
}

export function mergeAttrs(attrsEffect: any, node: any, updateProps: (node: any, key: string, value?: any) => void) {
  const oldAttrs: Record<string, any> = {}
  if (typeof attrsEffect == 'function') {
    const deleteKey = (key: string) => {
      updateProps(node, key)
      delete oldAttrs[key]
    }
    hookTrackSignal(attrsEffect, (attrs: any) => {
      objectDiffDeleteKey(oldAttrs, attrs, deleteKey)
      for (const key in attrs) {
        const value = attrs[key]
        if (oldAttrs[key] != value) {
          updateProps(node, key, value)
          oldAttrs[key] = value
        }
      }
    })
  } else {
    for (const key in attrsEffect) {
      const value = attrsEffect[key]
      if (key.startsWith("on")) {
        mergeEvent(node, key, value)
      } else {
        if (typeof value == 'function') {
          hookTrackSignal(value, v => {
            const oldV = oldAttrs[key]
            if (oldV != v) {
              updateProps(node, key, v)
              oldAttrs[key] = v
            }
          })
        } else {
          updateProps(node, key, value)
        }
      }
    }
  }
}

function mergeEvent(node: any, key: string, value: any) {
  let eventType = key.toLowerCase().substring(2)
  let capture = false
  if (eventType.endsWith(Capture)) {
    eventType = eventType.slice(0, eventType.length - Capture.length)
    capture = true
  }
  node.addEventListener(eventType, value, capture)
}
const Capture = "capture"
export function mergeEvents(events: any, node: any) {
  for (const key in events) {
    const value = events[key]
    mergeEvent(node, key, value)
  }
}

export type OrFun<T extends {}> = {
  [key in keyof T]: T[key] | GetValue<T[key]>
}

/**
 * 静态的
 * 动态的
 */
type DomEffectAttr<T extends DomElementType> = (OrFun<BDomAttribute<T>> & React.DOMAttributes<DomElement<T>>) | (() => BDomAttribute<T>)

export class DomCreater<T extends DomElementType> {
  /**
   * 其实这3个属性可以改变,
   * 因为只在最终render阶段释放.
   * 主要是portal可以改变
   * 其实attr也可以改变.只有type一开始就不再可以改变
   * @param type 
   * @param attrsEffect 
   * @param portal 
   */
  constructor(
    public readonly type: T
  ) { }

  public attrsEffect: DomEffectAttr<T> = emptyObject as any
  public portal?: boolean

  attrs(v: DomEffectAttr<T>) {
    this.attrsEffect = v
    return this
  }
  private e: React.DOMAttributes<DomElement<T>> = emptyObject
  events(v: React.DOMAttributes<DomElement<T>>) {
    this.e = v
  }
  setPortal(b: any) {
    this.portal = b
    return this
  }

  private useHelper() {
    const node = document.createElement(this.type)
    if (!this.portal) {
      hookAddResult(node)
    }
    mergeAttrs(this.attrsEffect, node, updateDomProps)
    mergeEvents(this.e, node)
    return node
  }

  renderHtml(ts: TemplateStringsArray, ...vs: VType[]) {
    const node = this.useHelper()
    mergeToContent(ts, vs, node, 'innerHTML')
    return node
  }
  renderText(ts: TemplateStringsArray, ...vs: VType[]) {
    const node = this.useHelper()
    mergeToContent(ts, vs, node, 'textContent')
    return node
  }


  renderInnerHTML(innerHTML: VType) {
    const node = this.useHelper()
    mergeToContent1(innerHTML, node, 'innerHTML')
    return node
  }
  renderTextContent(textContent: VType) {
    const node = this.useHelper()
    mergeToContent1(textContent, node, 'textContent')
    return node
  }
  render(fun: (node: DomElement<T>) => void = emptyFun): DomElement<T> {
    const node = this.useHelper()
    hookBuildChildren(node, fun)
    return node
  }
}

let dom: {
  readonly [key in DomElementType]: {
    (props?: DomEffectAttr<key>, isPortal?: boolean): DomCreater<key>
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
      const creater = new DomCreater(p as DomElementType)
      const newV = function (args: any, isPortal: any) {
        creater.attrsEffect = args
        creater.portal = isPortal
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
    const creater = new DomCreater(tag)
    cacheDom[tag] = function (args: any, isPortal: any) {
      creater.attrsEffect = args
      creater.portal = isPortal
      return creater
    }
  })
}

export {
  dom
}