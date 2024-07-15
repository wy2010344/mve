import { DomAttribute, DomElement, DomElementType } from "./html"
import { arrayNotEqualDepsWithEmpty, emptyObject } from 'wy-helper'
import { createStoreValueCreater, genTemplateString } from "./util"
import { MemoEvent, StoreValueCreater, hookAddResult, renderFiber } from "mve-core"
import { updateDom } from "./updateDom"
import { useMemo } from "mve-helper"
class DomHelper<T extends DomElementType>{
  public readonly node: DomElement<T>
  constructor(
    type: T
  ) {
    this.node = document.createElement(type)
  }
  private oldAttrs: DomAttribute<T> = emptyObject
  private contentType?: DomContentAs = undefined
  private content?: string = undefined
  private contentEditable?: ContentEditable
  updateAttrs(attrs: DomAttribute<T>) {
    updateDom(this.node, updateProps, attrs, this.oldAttrs)

    this.oldAttrs = attrs
  }
  updateContent(contentType: "html" | "text", content: string, contentEditable?: ContentEditable) {
    if (contentType != this.contentType || content != this.content) {
      if (contentType == 'html') {
        this.node.innerHTML = content
      } else if (contentType == 'text') {
        this.node.textContent = content
      }
    }
    if (contentEditable != this.contentEditable) {
      this.node.contentEditable = (contentEditable || 'inherit') + ''
    }
    this.contentType = contentType
    this.content = content
    this.contentEditable = contentEditable
  }


  private storeValueCreater: StoreValueCreater | undefined = undefined
  getStoreValueCreater() {
    if (!this.storeValueCreater) {
      this.storeValueCreater = createStoreValueCreater(this.node)
    }
    return this.storeValueCreater
  }
  static create<T extends DomElementType>(e: MemoEvent<T>) {
    return new DomHelper(e.trigger)
  }
}

type DomContentAs = "html" | "text"
type ContentEditable = boolean | "inherit" | "plaintext-only"

type AttrsEffect<T> = () => T
export class DomCreater<T extends DomElementType>{
  private constructor(
    public readonly type: T,
    public readonly attrsEffect: AttrsEffect<DomAttribute<T>>,
    public readonly portal?: boolean
  ) { }



  static of<T extends DomElementType>(
    type: T,
    attrsEffect: AttrsEffect<DomAttribute<T>> | DomAttribute<T>,
    portal?: boolean
  ) {
    return new DomCreater(
      type,
      typeof attrsEffect == 'function' ? attrsEffect : () => attrsEffect,
      portal
    )
  }
  renderHtml(ts: TemplateStringsArray, ...vs: (string | number)[]) {
    return this.renderInnerHTML(genTemplateString(ts, vs))
  }
  renderText(ts: TemplateStringsArray, ...vs: (string | number)[]) {
    return this.renderTextContent(genTemplateString(ts, vs))
  }
  renderInnerHTML(innerHTML: string, contentEditable?: boolean | "inherit" | "plaintext-only") {
    const helper = useMemo(DomHelper.create, this.type)
    const attrs = this.attrsEffect()
    helper.updateAttrs(attrs)
    helper.updateContent("html", innerHTML, contentEditable)
    return this.after(helper)
  }
  renderTextContent(textContent: string, contentEditable?: boolean | "inherit" | "plaintext-only") {
    const helper = useMemo(DomHelper.create, this.type)
    const attrs = this.attrsEffect()
    helper.updateAttrs(attrs)
    helper.updateContent("text", textContent, contentEditable)
    return this.after(helper)
  }
  render() {
    const helper = useMemo(DomHelper.create, this.type)
    const attrs = this.attrsEffect()
    helper.updateAttrs(attrs)
    return this.after(helper)
  }
  private after(helper: DomHelper<T>) {
    if (!this.portal) {
      hookAddResult(helper.node)
    }
    return helper.node
  }
  renderFragment<D extends any[]>(fun: (e: MemoEvent<D>) => void, deps: D): DomElement<T>
  renderFragment(fun: (e: MemoEvent<undefined>) => void): DomElement<T>
  renderFragment(fun: any, deps?: any) {
    const helper = useMemo(DomHelper.create, this.type)
    const attrs = this.attrsEffect()
    helper.updateAttrs(attrs)
    renderFiber(helper.getStoreValueCreater(), arrayNotEqualDepsWithEmpty, fun, deps)
    return this.after(helper)
  }
}


const emptyKeys = ['href', 'className']
export function updateProps(node: any, key: string, value?: any) {
  if (key.includes('-')) {
    node.setAttribute(key, value)
  } else {
    if (emptyKeys.includes(key) && !value) {
      node.removeAttribute(key)
    } else {
      node[key] = value
    }
  }
}