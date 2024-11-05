import { hookAddResult } from "mve-core"
import { BSvgAttribute, getAttributeAlias, React, SvgElement, SvgElementType, svgTagNames } from "wy-dom-helper"
import { emptyFun, emptyObject, VType } from "wy-helper"
import { mergeAttrs, mergeEvents, mergeToContent, mergeToContent1, OrFun, updateDomProps } from "./dom"
import { hookBuildChildren } from "./hookChildren"


type SvgEffectAttr<T extends SvgElementType> = (OrFun<BSvgAttribute<T>> & React.DOMAttributes<SvgElement<T>>) | (() => BSvgAttribute<T>)


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

export class SvgCreater<T extends SvgElementType> {
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

  public attrsEffect: SvgEffectAttr<T> = emptyObject as any
  public portal?: boolean

  attrs(v: SvgEffectAttr<T>) {
    this.attrsEffect = v
    return this
  }
  private e: React.DOMAttributes<SvgElement<T>> = emptyObject
  events(v: React.DOMAttributes<SvgElement<T>>) {
    this.e = v
  }
  setPortal(b: any) {
    this.portal = b
    return this
  }

  private useHelper() {
    const node = document.createElementNS("http://www.w3.org/2000/svg", this.type)
    if (!this.portal) {
      hookAddResult(node)
    }
    mergeAttrs(this.attrsEffect, node, updateSVGProps)
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
  render(fun: (node: SvgElement<T>) => void = emptyFun): SvgElement<T> {
    const node = this.useHelper()
    hookBuildChildren(node, fun)
    return node
  }
}



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
      const creater = new SvgCreater(p as SvgElementType)
      const newV = function (args: any, isPortal: any) {
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
    const creater = new SvgCreater(tag)
    cacheSvg[tag] = function (args: any, isPortal: any) {
      creater.attrsEffect = args
      creater.portal = isPortal
      return creater
    }
  })
}

export {
  svg
}