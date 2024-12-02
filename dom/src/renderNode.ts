import { BDomAttribute, BDomEvent, BSvgAttribute, BSvgEvent, DomElement, DomElementType, getAttributeAlias, PureCSSProperties, React, SvgElement, SvgElementType } from "wy-dom-helper"
import { OrFun, renderPortal } from "./hookChildren"
import { EmptyFun, emptyObject, GetValue, SetValue } from "wy-helper"
import { hookTrackSignalMemo } from "mve-helper"
import { hookAddResult } from "mve-core"

type DataAttribute = {
  [key in `data_${string}`]?: string | number | boolean
}

type BDomAttributeC<T extends DomElementType> = Omit<BDomAttribute<T>, 'className'>

type BDomAttributeCS<T extends DomElementType> = {
  [key in keyof BDomAttributeC<T> as (key extends string ? `a_${key}` : key)]: BDomAttributeC<T>[key]
}


type BSvgAttributeC<T extends SvgElementType> = Omit<BSvgAttribute<T>, 'className'>
type BSvgAttributeCS<T extends SvgElementType> = {
  [key in keyof BSvgAttributeC<T> as (key extends string ? `a_${key}` : key)]: BSvgAttributeC<T>[key]
}
/**
 * css变量
 */
type CssVaribute = {
  [key in `css_${string}`]?: string | number | boolean
}

/**
 * style属性
 */
type StyleProps = {
  [key in keyof PureCSSProperties as `s_${key}`]: PureCSSProperties[key]
}

// type ReplaceDashWithUnderscore<Key> = Key extends string
//   ? Key extends `${infer Prefix}-${infer Suffix}`
//   ? `${ReplaceDashWithUnderscore<Prefix>}_${ReplaceDashWithUnderscore<Suffix>}`
//   : Key
//   : Key;

type ReplaceAria<Key> = Key extends string
  ? Key extends `${infer Prefix}-${infer Suffix}`
  ? `${Prefix}_${Suffix}`
  : Key
  : Key;

/**
 * Aria属性
 */
type AriaAttribute = {
  [key in keyof React.AriaAttributes as ReplaceAria<key>]: React.AriaAttributes[key]
}


export type DomAttribute<T extends DomElementType> = {
  className?: string
} & DataAttribute
  & BDomAttributeCS<T>
  & AriaAttribute
  & StyleProps
  & CssVaribute


export type SVGAttributes<T extends SvgElementType> = {
  className?: string
} & DataAttribute
  & BSvgAttributeCS<T>
  & AriaAttribute
  & StyleProps
  & CssVaribute

type ChildAttr<T> = {
  childrenType: "text"
  children: string | GetValue<string>
} | {
  childrenType: "html"
  children: string | GetValue<string>
} | {
  children?: SetValue<T>
}
function mergeValue(
  node: Node,
  value: any,
  setValue: (value: any, v: Node) => void
): void
function mergeValue(
  node: Node,
  value: any,
  setValue: (value: any, v: Node, ext: string) => void,
  ext: string
): void
function mergeValue(
  node: any, value: any, setValue: any
) {
  const ext = arguments[3]
  if (typeof value == 'function') {
    hookTrackSignalMemo(value, setValue, node, ext)
  } else {
    setValue(value, node, ext)
  }
}
function setClassName(value: string, node: any) {
  node.className = value
}

function setText(value: string, node: any) {
  node.textContent = value
}

function setHtml(value: string, node: any) {
  node.innerHTML = value
}
const ATTR_PREFIX = "a_"

function updateDom(value: any, node: any, key: string,) {
  if (key == 'href') {
    node[key] = value || ''
  } else {
    node[key] = value
  }
}

function updateSvg(value: any, node: any, key: string,) {
  key = getAttributeAlias(key)
  if (value) {
    node.setAttribute(key, value)
  } else {
    node.removeAttribute(key)
  }
}

function updateData(value: any, node: any, key: any) {
  node.dataset[key] = value
}
function updateAttr(value: any, node: any, key: string) {
  if (value) {
    node.setAttribute(key, value)
  } else {
    node.removeAttribute(key)
  }
}

function updateStyle(value: any, node: any, key: string) {
  node.style[key] = value
}

function updateCssVariable(value: any, node: any, key: string) {
  if (typeof value == 'undefined') {
    node.style.removeProperty(key)
  } else {
    node.style.setProperty(key, value)
  }
}
const ON_PREFIX = "on"
const CAPTURE_SUFFIX = "Capture"
const DATA_PREFIX = "data_"
const ARIA_PREFIX = "aria_"
const S_PREFIX = "s_"
const CSS_PREFIX = "css_"
function renderNode(node: Node, arg: any, updateMAttr: (value: any, node: any, key: string) => void) {
  for (const key in arg) {
    if (key == 'className') {
      mergeValue(node, arg[key], setClassName)
    } else if (key.startsWith(ON_PREFIX)) {
      const value = arg[key]
      if (value) {
        let eventType = key.slice(ON_PREFIX.length)
        let capture = false
        if (eventType.endsWith(CAPTURE_SUFFIX)) {
          capture = true
          eventType = eventType.slice(0, eventType.length - CAPTURE_SUFFIX.length)
        }
        node.addEventListener(eventType, value, capture)
      }
    } else if (key.startsWith(ATTR_PREFIX)) {
      const attrKey = key.slice(ATTR_PREFIX.length)
      mergeValue(node, arg[key], updateMAttr, attrKey)
    } else if (key.startsWith(DATA_PREFIX)) {
      const dataAttr = key.slice(DATA_PREFIX.length)
      mergeValue(node, arg[key], updateData, dataAttr)
    } else if (key.startsWith(ARIA_PREFIX)) {
      const ariaKey = key.slice(ARIA_PREFIX.length)
      mergeValue(node, arg[key], updateAttr, `aria-${ariaKey}`)
    } else if (key.startsWith(S_PREFIX)) {
      const styleKey = key.slice(S_PREFIX.length)
      mergeValue(node, arg[key], updateStyle, styleKey)
    } else if (key.startsWith(CSS_PREFIX)) {
      const cssVariable = key.slice(CSS_PREFIX.length)
      mergeValue(node, arg[key], updateCssVariable, cssVariable)
    }
  }

  if (arg.childrenType == 'text') {
    mergeValue(node, arg.children, setText)
  } else if (arg.childrenType == 'html') {
    mergeValue(node, arg.children, setHtml)
  } else if (arg.children) {
    renderPortal(node, arg.children)
  }
  hookAddResult(node)
}
export function renderDom<T extends DomElementType>(type: T, arg: OrFun<DomAttribute<T>>
  & BDomEvent<T>
  & ChildAttr<DomElement<T>> = emptyObject as any
): DomElement<T> {
  const node = document.createElement(type)
  renderNode(node, arg, updateDom)
  return node
}
export function renderSvg<T extends SvgElementType>(type: T, arg: OrFun<SVGAttributes<T>>
  & BSvgEvent<T>
  & ChildAttr<SvgElement<T>> = emptyObject as any
): SvgElement<T> {
  const node = document.createElementNS("http://www.w3.org/2000/svg", type)
  renderNode(node, arg, updateSvg)
  return node
}