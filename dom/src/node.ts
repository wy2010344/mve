
import { genTemplateStringS2, genTemplateStringS1, objectDiffDeleteKey, VType, vTypeisGetValue, GetValue, emptyObject, emptyFun } from "wy-helper"
import { hookTrackSignal } from "mve-helper"
import { React } from "wy-dom-helper"
import { hookAddResult } from "mve-core"
import { hookBuildChildren } from "./hookChildren"

export type OrFun<T extends {}> = {
  [key in keyof T]: T[key] | GetValue<T[key]>
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


export class NodeCreater<T extends string, N extends Element, Attr extends {}> {
  static instance = new NodeCreater()
  public type!: T
  public create!: (n: T) => N
  public updateProps!: (node: N, key: string, value?: any) => void

  public attrsEffect: Attr = emptyObject as any
  public portal?: boolean

  attrs(v: Attr) {
    this.attrsEffect = v
    return this
  }
  private e: React.DOMAttributes<N> = emptyObject
  events(v: React.DOMAttributes<N>) {
    this.e = v
  }
  setPortal(b: any) {
    this.portal = b
    return this
  }

  private useHelper() {
    const node = this.create(this.type)
    if (!this.portal) {
      hookAddResult(node)
    }
    mergeAttrs(this.attrsEffect, node, this.updateProps)
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
  render(fun: (node: N) => void = emptyFun): N {
    const node = this.useHelper()
    hookBuildChildren(node, fun)
    return node
  }
}