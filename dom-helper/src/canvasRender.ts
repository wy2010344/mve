import { hookAddDestroy, hookAddResult } from "mve-core"
import { getRenderChildren } from "mve-dom"
import { hookTrackSignalMemo } from "mve-helper"
import { path2DOperate, Path2DOperate } from "wy-dom-helper"
import { asLazy, createSignal, emptyArray, emptyFun, EmptyFun, emptyObject, GetValue, memo, PointKey, ValueOrGet } from "wy-helper"
const LineBreaker = require('linebreak');

export function hookRect(rect: CNodeConfigure) {
  const n = new CNode(rect)
  hookAddResult(n)
  return n
}

type MyCtx = Omit<CanvasRenderingContext2D, 'translate' | 'reset' | 'save' | 'restore'>
function toCall(rect: CNodeConfigure, key: PointKey) {
  const x = rect[key]
  if (typeof x == 'function') {
    return memo(x)
  } else {
    return asLazy(x)
  }
}

export interface CMNode {
  x: GetValue<number>
  y: GetValue<number>
  children: GetValue<CNode[]>
  index(): number
  ctx: MyCtx
}
class CNode implements CMNode {
  constructor(
    public readonly configure: CNodeConfigure
  ) {
    this.x = toCall(configure, 'x')
    this.y = toCall(configure, 'y')
    if (configure.beforeChildren) {
      this.beforeChildren = getRenderChildren(configure.beforeChildren, undefined)
    } else {
      this.beforeChildren = asLazy(emptyArray as any[])
    }
    if (configure.children) {
      this.children = getRenderChildren(configure.children, undefined)
    } else {
      this.children = asLazy(emptyArray as any[])
    }
  }

  private parent?: CNode
  private _index!: number
  private parentGetChildren!: GetValue<CNode[]>

  ctx!: MyCtx
  setParentAndIndex(
    getChildren: () => CNode[],
    index: number,
    parent?: CNode
  ) {
    if (!!this.parentGetChildren) {
      if (this.parent != parent) {
        throw 'parent发生改变'
      }
      if (this.parentGetChildren != getChildren) {
        throw 'parent的children发生改变'
      }
    }
    this._index = index
    this.parent = parent
    this.parentGetChildren = getChildren
  }

  index() {
    this.parentGetChildren()
    return this._index
  }

  x: GetValue<number>
  y: GetValue<number>
  beforeChildren: GetValue<CNode[]>
  children: GetValue<CNode[]>

  path?: Path2D
}
interface CNodeConfigure {
  x: ValueOrGet<number>
  y: ValueOrGet<number>
  beforeChildren?(): void
  draw?(ctx: MyCtx): PathResult | void
  //这里可能有children()
  children?(): void

  mouseContainStroke?: boolean

  onClick?(e: CanvasMouseEvent<MouseEvent>): any
  onMouseDown?(e: CanvasMouseEvent<MouseEvent>): any
  onMouseUp?(e: CanvasMouseEvent<MouseEvent>): any
  onPointerDown?(e: CanvasMouseEvent<PointerEvent>): any
  onPointerUp?(e: CanvasMouseEvent<PointerEvent>): any


  onClickCapture?(e: CanvasMouseEvent<MouseEvent>): any
  onMouseDownCapture?(e: CanvasMouseEvent<MouseEvent>): any
  onMouseUpCapture?(e: CanvasMouseEvent<MouseEvent>): any
  onPointerDownCapture?(e: CanvasMouseEvent<PointerEvent>): any
  onPointerUpCapture?(e: CanvasMouseEvent<PointerEvent>): any
}


type CanvasMouseEvent<T> = {
  x: number
  y: number
  inPath: boolean
  inStroke: boolean
  original: T
  node: CNode
}

export type PathResult = {
  path: Path2D
  operates?: Path2DOperate[]
  clipFillRule?: CanvasFillRule
  afterClipOperates?: Path2DOperate[]
}

function doToEvent(
  _ctx: CanvasRenderingContext2D,
  children: CNode[],
  x: number,
  y: number,
  cs: CanvasMouseEvent<undefined>[],
  callback: (child: CanvasMouseEvent<undefined>) => any
): boolean {
  let will = true
  let i = 0
  while (will && i < children.length) {
    const child = children[i]
    const nx = x - child.x()
    const ny = y - child.y()

    will = doToEvent(_ctx, child.beforeChildren(), nx, ny, cs, callback)

    if (will && child.path) {
      //inPath,就是点在边界内
      const inPath = _ctx.isPointInPath(child.path, nx, ny)
      //inStroke,就是点恰好在边界中间,因为stroke在边界两边
      const inStroke = child.configure.mouseContainStroke ? _ctx.isPointInStroke(child.path, nx, ny) : false
      if (inPath || inStroke) {
        const e = {
          node: child,
          x: nx,
          y: ny,
          inPath,
          inStroke,
          original: undefined
        }
        cs.unshift(e)
        if (callback(e)) {
          will = false
          cs.length = 0
        }
      }
    }
    if (will) {
      will = doToEvent(_ctx, child.children(), nx, ny, cs, callback)
      i++
    }
  }
  return will
}

function doEvent(_ctx: CanvasRenderingContext2D,
  children: CNode[],
  x: number,
  y: number,
  capture: (child: CanvasMouseEvent<undefined>) => any,
  back: (child: CanvasMouseEvent<undefined>) => any
) {
  const cs: CanvasMouseEvent<undefined>[] = []
  doToEvent(_ctx, children, x, y, cs, capture)
  for (let i = 0; i < cs.length; i++) {
    if (back(cs[i])) {
      return
    }
  }
}



const mouseEvents = (['onClick', 'onMouseDown', 'onMouseUp', 'onPointerDown', 'onPointerUp'] as const).map(name => {
  return {
    name: name.slice(2).toLowerCase(),
    onEvent: name,
    onCaptureEvent: name + 'Capture'
  }
})
export function renderCanvas(
  canvas: HTMLCanvasElement,
  children: EmptyFun
) {
  const getChildren = getRenderChildren<CNode, undefined>(children, undefined)
  let _ctx: CanvasRenderingContext2D
  let _children: CNode[]


  mouseEvents.forEach(me => {
    canvas.addEventListener(me.name as 'click', e => {
      doEvent(
        _ctx,
        _children,
        e.offsetX,
        e.offsetY,
        child => {
          const c = child as unknown as CanvasMouseEvent<MouseEvent>
          c.original = e
          return child.node.configure[me.onCaptureEvent as 'onClickCapture']?.(c)
        },
        child => {
          const c = child as unknown as CanvasMouseEvent<MouseEvent>
          c.original = e
          return child.node.configure[me.onEvent as 'onClick']?.(c)
        }
      )
    })
  })

  const width = createSignal(canvas.width)
  const height = createSignal(canvas.height)
  const ob = new ResizeObserver(() => {
    width.set(canvas.width)
    height.set(canvas.height)
  })
  ob.observe(canvas)
  hookAddDestroy()(() => {
    ob.disconnect()
  })
  hookTrackSignalMemo(() => {
    width.get()
    height.get()
    const ctx = canvas.getContext("2d")!
    function prepare(getChildren: GetValue<CNode[]>, parent?: CNode) {
      getChildren().forEach((child, i) => {
        child.ctx = ctx
        child.setParentAndIndex(getChildren, i, parent)
        prepare(child.beforeChildren, child)
        prepare(child.children, child)
      })
    }
    prepare(getChildren)
    function draw(
      children: CNode[]
    ) {
      children.forEach((child) => {
        const x = child.x()
        const y = child.y()
        ctx.save()
        //因为是累加的,所以返回
        ctx.translate(x, y)
        child.path = undefined
        draw(child.beforeChildren())
        const path = child.configure.draw?.(ctx)
        if (path) {
          child.path = path.path
          path2DOperate(ctx, path.path, path.operates || emptyArray)
          if (path.clipFillRule || path.afterClipOperates?.length) {
            ctx.clip(path.path, path.clipFillRule)
            path2DOperate(ctx, path.path, path.afterClipOperates || emptyArray)
          }
        }
        draw(child.children())
        // ctx.translate(-x, -y)
        ctx.restore()
      })
    }
    ctx.reset()
    draw(getChildren())
    _children = getChildren()
    _ctx = ctx
  }, emptyFun)
  return { width, height }
}


export type OCanvasTextDrawingStyles = Partial<CanvasTextDrawingStyles>

function setDrawingStyle(
  ctx: CanvasTextDrawingStyles,
  n: OCanvasTextDrawingStyles = emptyObject as any) {
  ctx.direction = n.direction || 'inherit'
  ctx.font = n.font || ''
  ctx.fontKerning = n.fontKerning || 'auto'
  ctx.fontStretch = n.fontStretch || 'normal'
  ctx.fontVariantCaps = n.fontVariantCaps || 'normal'
  ctx.letterSpacing = n.letterSpacing || '0px'
  ctx.textAlign = n.textAlign || 'start'
  ctx.textBaseline = n.textBaseline || 'alphabetic'
  ctx.textRendering = n.textRendering || 'auto'
  ctx.wordSpacing = n.wordSpacing || '0px'
}
export function measureText(
  ctx: MCtx,
  text: string,
  config?: OCanvasTextDrawingStyles) {
  setDrawingStyle(ctx, config)
  return ctx.measureText(text)
}

export type MeasuredTextWrapOut = {
  width: number
  height: number
  lineHeight: number
  config?: Omit<OCanvasTextDrawingStyles, 'textAlign'>
  lines: {
    width: number
    text: string
  }[]
}


type MCtx = CanvasTextDrawingStyles & {
  measureText(text: string): TextMetrics
}
export function measureTextWrap(
  ctx: MCtx,
  text: string,
  config: {
    config?: OCanvasTextDrawingStyles
    lineHeight: number
    width: number
    maxLines?: number
  }
): MeasuredTextWrapOut {
  let maxLines = config.maxLines || Infinity
  if (maxLines < 1) {
    maxLines = Infinity
  }
  setDrawingStyle(ctx, config.config)
  ctx.textAlign = 'left'
  const m = ctx.measureText(text)
  if (m.width <= config.width) {
    return {
      width: m.width,
      lineHeight: config.lineHeight,
      height: config.lineHeight,
      config: config.config,
      lines: [
        {
          width: m.width,
          text: text
        }
      ]
    }
  } else {
    const breaker = new LineBreaker(text);
    let bk, lastBreak, tryLine, currentLine = '', lastMeasuredWidth
    const measuredSize = {
      width: config.width,
      height: 0,
      lineHeight: config.lineHeight,
      config: config.config,
      lines: [] as {
        width: number
        text: string
      }[]
    }
    while (bk = breaker.nextBreak()) {
      var word = text.slice(lastBreak ? lastBreak.position : 0, bk.position);
      tryLine = currentLine + word;
      const textMetrics = ctx.measureText(tryLine);
      if (textMetrics.width > config.width || (lastBreak && lastBreak.required)) {
        const line = {
          width: lastMeasuredWidth!,
          text: currentLine!.trim()
        }
        measuredSize.lines.push(line);
        if (measuredSize.lines.length == maxLines) {
          const rest = text.slice(bk.position).trim()
          if (rest) {
            line.text = line.text.replace(/\,?\s?\w+$/, '…');
            line.width = ctx.measureText(line.text).width
          }
          measuredSize.height = measuredSize.lines.length * config.lineHeight
          return measuredSize
        }

        currentLine = word;
        lastMeasuredWidth = ctx.measureText(currentLine.trim()).width;
      } else {
        currentLine = tryLine;
        lastMeasuredWidth = textMetrics.width;
      }
      lastBreak = bk;
    }
    currentLine = currentLine!.trim();
    if (currentLine.length > 0) {
      const textMetrics = ctx.measureText(currentLine);
      measuredSize.lines.push({ width: textMetrics.width, text: currentLine });
    }
    measuredSize.height = measuredSize.lines.length * config.lineHeight
    return measuredSize
  }
}

type TextCtx = CanvasTextDrawingStyles & {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/fillStyle) */
  fillStyle: string | CanvasGradient | CanvasPattern;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/strokeStyle) */
  strokeStyle: string | CanvasGradient | CanvasPattern;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/fillText) */
  fillText(text: string, x: number, y: number, maxWidth?: number): void;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/strokeText) */
  strokeText(text: string, x: number, y: number, maxWidth?: number): void;
}
export function drawTextWrap(
  ctx: TextCtx,
  text: MeasuredTextWrapOut,
  style: string | CanvasGradient | CanvasPattern,
  arg?: {
    x?: number
    y?: number
    stroke?: boolean
    textAlign?: 'left' | 'center' | 'right'
  }
) {
  const x = arg?.x || 0
  const y = arg?.y || 0
  const textAlign = arg?.textAlign || 'left'
  setDrawingStyle(ctx, text?.config)
  ctx.textAlign = 'left'
  let fun: 'strokeText' | 'fillText'
  if (arg?.stroke) {
    ctx.strokeStyle = style
    fun = 'strokeText'
  } else {
    ctx.fillStyle = style
    fun = 'fillText'
  }
  let curY = y
  for (let i = 0; i < text.lines.length; i++) {
    const line = text.lines[i]
    let curX = x
    if (textAlign == 'center') {
      curX = x + (text.width - line.width) / 2
    } else if (textAlign == 'right') {
      curX = x + text.width - line.width
    }
    ctx[fun](line.text, curX, curY)
    curY += text.lineHeight
  }
}
export function drawText(
  ctx: TextCtx,
  text: string,
  style: string | CanvasGradient | CanvasPattern,
  arg?: {
    config?: OCanvasTextDrawingStyles,
    x?: number
    y?: number
    maxWidth?: number
    stroke?: boolean
  }
) {
  const x = arg?.x || 0
  const y = arg?.y || 0
  setDrawingStyle(ctx, arg?.config)
  let fun: 'strokeText' | 'fillText'
  if (arg?.stroke) {
    ctx.strokeStyle = style
    fun = 'strokeText'
  } else {
    ctx.fillStyle = style
    fun = 'fillText'
  }
  ctx[fun](text, x, y)
}