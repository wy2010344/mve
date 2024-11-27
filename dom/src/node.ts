
import { genTemplateStringS2, genTemplateStringS1, objectDiffDeleteKey, VType, vTypeisGetValue, GetValue, emptyObject, emptyFun } from "wy-helper"
import { hookTrackSignalMemo } from "mve-helper"
import { CSSProperties, React } from "wy-dom-helper"
import { hookAddResult } from "mve-core"
import { renderPortal } from "./hookChildren"

export type OrFun<T extends {}> = {
  [key in keyof T]: T[key] | GetValue<T[key]>
}

export type StyleProps = {
  style?: string | GetValue<string> | GetValue<CSSProperties> | OrFun<CSSProperties>
}

export type StyleGetProps = {
  style?: string | CSSProperties
}
export function mergeToContent(ts: TemplateStringsArray, vs: VType[], node: any, key: string) {
  if (vs.some(vTypeisGetValue)) {
    let oldContent = ''
    hookTrackSignalMemo(() => genTemplateStringS2(ts, vs), content => {
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
    hookTrackSignalMemo(v, content => {
      if (content != oldContent) {
        node[key] = content
      }
    })
  } else {
    node[key] = v
  }
}

function mergeStyle(style: any, node: any, oldStyle: any) {
  const tp = typeof style
  if (tp == 'string') {
    //字符串
    if (style != oldStyle) {
      node.style = style
    }
  } else {
    style = style || emptyObject
    //视着object,差异更新
    let oldMap = oldStyle
    if (typeof oldStyle == 'string') {
      node.style = ''
      oldMap = emptyObject
    }
    objectDiffDeleteKey(oldMap, style, key => {
      if (key.startsWith("--")) {
        setStyleP(undefined, node, key)
      } else {
        setStyle("", node, key)
      }
    })
    for (const key in style) {
      const value = style[key]
      if (oldMap[key] != value) {
        if (key.startsWith("--")) {
          setStyleP(value, node, key)
        } else {
          setStyle(value, node, key)
        }
      }
    }
  }
  return style
}

export function mergeAttrs(attrsEffect: any, node: any, updateProps: (node: any, key: string, value?: any) => void) {
  const oldAttrs: Record<string, any> = {}
  if (typeof attrsEffect == 'function') {
    const deleteKey = (key: string) => {
      updateProps(node, key)
      delete oldAttrs[key]
    }

    let oldStyle = ''
    hookTrackSignalMemo(attrsEffect, (attrs: any) => {
      objectDiffDeleteKey(oldAttrs, attrs, deleteKey)
      for (const key in attrs) {
        const value = attrs[key]
        if (oldAttrs[key] != value) {
          if (key == 'style') {
            oldStyle = mergeStyle(value, node, oldStyle)
          } else {
            updateProps(node, key, value)
            oldAttrs[key] = value
          }
        }
      }
    })
  } else {
    for (const key in attrsEffect) {
      const value = attrsEffect[key]
      if (key.startsWith("on")) {
        mergeEvent(node, key, value)
      } else {
        if (key == 'style') {
          const tp = typeof value
          if (tp == 'function') {
            let oldStyle = ''
            hookTrackSignalMemo(value, v => {
              oldStyle = mergeStyle(v, node, oldStyle)
            })
          } else if (tp == 'string') {
            node.style = value
          } else if (value) {
            //object
            const oldStyle: Record<string, any> = {}
            for (const key in value) {
              const field = value[key]
              if (key.startsWith('--')) {
                mergeStyle1(field, oldStyle, key, node, setStyleP)
              } else {
                mergeStyle1(field, oldStyle, key, node, setStyle)
              }
            }
          }
        } else {
          if (typeof value == 'function') {
            hookTrackSignalMemo(value, v => {
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
}

function mergeStyle1(
  value: any,
  oldStyle: any,
  key: string,
  node: any,
  setStyle: (value: string, node: any, key: string) => void) {
  if (typeof value == 'function') {
    hookTrackSignalMemo<string>(value, value => {
      if (oldStyle[key] != value) {
        setStyle(value, node, key)
        oldStyle[key] = value
      }
    })
  } else {
    setStyle(value, node, key)
  }
}

function setStyleP(v: string | number | undefined, node: any, key: string) {
  if (typeof v == 'undefined') {
    node.style.removeProperty(key)
  } else {
    node.style.setProperty(key, v)
  }
}
function setStyle(v: string | number | undefined, node: any, key: string) {
  node.style[key] = v
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
  attrs(v: Attr) {
    this.attrsEffect = v
    return this
  }
  private e: React.DOMAttributes<N> = emptyObject
  events(v: React.DOMAttributes<N>) {
    this.e = v
  }

  private useHelper() {
    const node = this.create(this.type)
    hookAddResult(node)
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
    renderPortal(node, fun)
    return node
  }
}