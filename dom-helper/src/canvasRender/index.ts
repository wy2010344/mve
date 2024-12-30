import { hookAddDestroy, hookAddResult } from "mve-core"
import { getRenderChildren } from "mve-dom"
import { hookTrackSignalMemo } from "mve-helper"
import { path2DOperate, Path2DOperate } from "wy-dom-helper"
import { asLazy, batchSignalEnd, createSignal, emptyArray, emptyFun, EmptyFun, emptyObject, GetValue, memo, PointKey, ValueOrGet } from "wy-helper"

export function hookDraw(rect: CNodeConfigure) {
  const n = new CNode(rect)
  hookAddResult(n)
  return n
}

export type CanvaRenderCtx = Omit<CanvasRenderingContext2D, 'translate' | 'reset' | 'save' | 'restore'>
function toCall(rect: CNodeConfigure, key: PointKey) {
  const x = rect[key]
  if (typeof x == 'function') {
    return memo(x)
  } else {
    return asLazy(x)
  }
}

interface NodeParent {
  readonly ext: Record<string, any>
  beforeChildren?: GetValue<CNode[]>
  children: GetValue<CNode[]>
}
export interface CMNode extends NodeParent {
  x: GetValue<number>
  y: GetValue<number>
  index(): number
  ctx: CanvaRenderCtx
  hasClip: boolean
  isBefore?: boolean
  parent: NodeParent
}


class CNode implements CMNode {
  readonly ext: Record<string, any>
  constructor(
    public readonly configure: CNodeConfigure
  ) {
    this.ext = configure.ext || emptyObject
    this.x = toCall(configure, 'x')
    this.y = toCall(configure, 'y')
    if (configure.beforeChildren) {
      this.beforeChildren = getRenderChildren(configure.beforeChildren, this)
    } else {
      this.beforeChildren = asLazy(emptyArray as any[])
    }
    if (configure.children) {
      this.children = getRenderChildren(configure.children, this)
    } else {
      this.children = asLazy(emptyArray as any[])
    }
  }

  public hasClip = false
  parent!: NodeParent
  private _index!: number
  ctx!: CanvaRenderCtx
  public isBefore: boolean | undefined
  setParentAndIndex(
    index: number,
    parent: NodeParent
  ) {
    if (this.parent && this.parent != parent) {
      throw 'parent发生改变'
    }
    this._index = index
    this.parent = parent
  }

  index() {
    if (this.isBefore) {
      this.parent.beforeChildren!()
    } else {
      this.parent.children()
    }
    return this._index
  }

  x: GetValue<number>
  y: GetValue<number>
  beforeChildren: GetValue<CNode[]>
  children: GetValue<CNode[]>

  path?: Path2D
}
export interface CNodeConfigure {
  x: ValueOrGet<number>
  y: ValueOrGet<number>
  beforeChildren?(): void
  draw?(ctx: CanvaRenderCtx): PathResult | void
  //这里可能有children()
  children?(): void

  mouseContainStroke?: boolean

  onClick?(e: CanvasMouseEvent<MouseEvent>): any
  onMouseDown?(e: CanvasMouseEvent<MouseEvent>): any
  onMouseUp?(e: CanvasMouseEvent<MouseEvent>): any
  onPointerDown?(e: CanvasMouseEvent<PointerEvent>): any
  onPointerUp?(e: CanvasMouseEvent<PointerEvent>): any
  // onTouchDown?(e: CanvasMouseEvent<TouchEvent>): any
  // onTouchUp?(e: CanvasMouseEvent<TouchEvent>): any

  onClickCapture?(e: CanvasMouseEvent<MouseEvent>): any
  onMouseDownCapture?(e: CanvasMouseEvent<MouseEvent>): any
  onMouseUpCapture?(e: CanvasMouseEvent<MouseEvent>): any
  onPointerDownCapture?(e: CanvasMouseEvent<PointerEvent>): any
  onPointerUpCapture?(e: CanvasMouseEvent<PointerEvent>): any
  // onTouchDownCapture?(e: CanvasMouseEvent<TouchEvent>): any
  // onTouchUpCapture?(e: CanvasMouseEvent<TouchEvent>): any
  ext?: Record<string, any>
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

    let tryChildren = true
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
      } else if (child.hasClip) {
        tryChildren = false
      }
    }
    if (will && tryChildren) {
      will = doToEvent(_ctx, child.children(), nx, ny, cs, callback)
    }
    i++
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



const mouseEvents = ([
  'onClick',
  // 'onTouchDown', 'onTouchUp',
  'onMouseDown', 'onMouseUp',
  'onPointerDown', 'onPointerUp'
] as const).map(name => {
  return {
    name: name.slice(2).toLowerCase(),
    onEvent: name,
    onCaptureEvent: name + 'Capture'
  }
})


export function renderCanvas(
  canvas: HTMLCanvasElement,
  children: EmptyFun,
  ext: Record<string, any> = emptyObject
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
    batchSignalEnd()
  })
  ob.observe(canvas)
  hookAddDestroy()(() => {
    ob.disconnect()
  })
  const rootParent = {
    ext: ext,
    children: getChildren
  }
  hookTrackSignalMemo(() => {
    width.get()
    height.get()
    const ctx = canvas.getContext("2d")!
    function prepare(getChildren: GetValue<CNode[]>, parent: NodeParent, before?: boolean) {
      getChildren().forEach((child, i) => {
        child.ctx = ctx
        child.isBefore = before
        child.setParentAndIndex(i, parent)
        prepare(child.beforeChildren, child, true)
        prepare(child.children, child)
      })
    }
    prepare(getChildren, rootParent)
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
          let hasClip = false
          if (path.clipFillRule || path.afterClipOperates?.length) {
            hasClip = true
            ctx.clip(path.path, path.clipFillRule)
            path2DOperate(ctx, path.path, path.afterClipOperates || emptyArray)
          }
          (child as any).hasClip = hasClip
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
