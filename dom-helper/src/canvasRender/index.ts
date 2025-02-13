import { hookAddDestroy, hookAddResult } from "mve-core"
import { getRenderChildren } from "mve-dom"
import { hookTrackSignal } from "mve-helper"
import { path2DOperate, Path2DOperate } from "wy-dom-helper/canvas"
import { asLazy, batchSignalEnd, createSignal, emptyArray, EmptyFun, emptyObject, GetValue, ValueOrGet, valueOrGetToGet } from "wy-helper"

export * from './hookDrawImage'
export * from './hookDrawRect'
export * from './hookDrawText'
export function hookDraw(rect: CNodeConfigure) {
  const n = new CNode(rect)
  hookAddResult(n)
  return n
}

export type CanvaRenderCtx = Omit<CanvasRenderingContext2D, 'reset' | 'save' | 'restore'>

interface NodeParent {
  readonly ext: Record<string, any>
  beforeChildren?: GetValue<CNode[]>
  children: GetValue<CNode[]>
}
export interface CMNode extends NodeParent {
  x: GetValue<number>
  y: GetValue<number>
  index(): number
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
    this.x = valueOrGetToGet(configure.x)
    this.y = valueOrGetToGet(configure.y)
    if (configure.beforeChildren) {
      this.beforeChildren = makeParentAndIndex(configure.beforeChildren, this, true)
    } else {
      this.beforeChildren = asLazy(emptyArray as any[])
    }
    if (configure.children) {
      this.children = makeParentAndIndex(configure.children, this)
    } else {
      this.children = asLazy(emptyArray as any[])
    }
  }

  public hasClip = false
  parent!: NodeParent// = hookCurrentParent() as NodeParent
  // ctx!: CanvaRenderCtx
  public isBefore: boolean | undefined
  setParent(
    parent: NodeParent,
    index: number,
    isBefore: boolean
  ) {
    if (this.parent && this.parent != parent) {
      throw 'parent发生改变'
    }
    this.parent = parent
    this._index = index
    this.isBefore = isBefore
  }
  private _index: number = 0

  index() {
    /**
     * 使用这个可能就够了,children变化必然触发重绘
     * 因为所有操作都必须有实时性延迟,此时绘制已经完成了
     * 即如果更新到dom上,需要addEffect里面去操作
     */
    if (this.isBefore) {
      this.parent.beforeChildren?.()
    } else {
      this.parent.children()
    }
    return this._index
  }

  /**
   * 这个每次至少遍历一遍,多计算一步
   */
  // index = memo(() => {
  //   if (this.isBefore) {
  //     return this.parent.beforeChildren!().indexOf(this)
  //   } else {
  //     return this.parent.children().indexOf(this)
  //   }
  // })

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


export type CanvasMouseEvent<T> = {
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
  const rootParent: NodeParent = {
    ext: ext,
    children: undefined as any
  }
  const getChildren = makeParentAndIndex(children, rootParent)
  rootParent.children = getChildren
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
  hookTrackSignal(() => {
    width.get()
    height.get()
    const ctx = canvas.getContext("2d")!
    const beforeCtx = m._mve_canvas_render_ctx
    m._mve_canvas_render_ctx = ctx
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
    ext.beforeDraw?.(ctx)
    draw(getChildren())
    _children = getChildren()
    _ctx = ctx
    m._mve_canvas_render_ctx = beforeCtx
  })
  return { width, height }
}


const m = globalThis as {
  _mve_canvas_render_ctx?: CanvaRenderCtx
}

export function hookCurrentCtx() {
  return m._mve_canvas_render_ctx!
}


function makeParentAndIndex(
  children: EmptyFun,
  parent: NodeParent,
  before = false
) {
  return getRenderChildren<CNode, NodeParent>(children, parent, list => {
    list.forEach((row, index) => {
      row.setParent(parent, index, before)
    })
  })
}