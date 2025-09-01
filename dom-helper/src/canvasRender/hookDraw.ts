import { AppendList, hookAddDestroy, hookAddResult, HookChild } from 'mve-core'
import { fdom, FDomAttributes } from 'mve-dom'
import { hookTrackSignal } from 'mve-helper'
import { CanvasStyle, path2DOperate, Path2DOperate } from 'wy-dom-helper/canvas'
import {
  batchSignalEnd,
  createSignal,
  emptyArray,
  EmptyFun,
  emptyObject,
  GetValue,
  PointKey,
  SetValue,
  ValueOrGet,
  valueOrGetToGet,
} from 'wy-helper'

export function hookDraw(rect: CNodeConfigure) {
  const n = new CNode(rect)
  hookAddResult(n)
  return n
}

export type CanvaRenderCtx = Omit<
  CanvasRenderingContext2D,
  'reset' | 'save' | 'restore'
>

/**
 * 设置beforeChildren的目的本来是
 * 同一位置,不被剪切影响
 * 因为clip后所有children必然被剪切影响
 * 不必要,显式设置相同位置
 * 在布局中,通过追加stack布局,使两个元素重叠,从而不受后一个元素的布局影响.
 */
interface NodeParent {
  readonly ext: Record<string, any>
  // beforeChildren?: GetValue<CNode[]>
  children: GetValue<readonly CNode[]>
  getAbsolute(key: PointKey): number
}
export type CMNode = NodeParent & {
  x: GetValue<number>
  y: GetValue<number>
  index(): number
  hasClip: boolean
  // isBefore?: boolean
  parent: NodeParent
}

class CNode implements CMNode {
  readonly ext: Record<string, any>
  private list: HookChild<CNode>[] = []
  private appendList = new AppendList(this, this.list, (list) => {
    list.forEach((row, index) => {
      row.setParent(this, index)
    })
  })
  children = this.appendList.target
  collect<T = void>(fun: (n: CNode) => T) {
    return this.appendList.collect(fun)
  }
  constructor(public readonly configure: CNodeConfigure) {
    this.ext = configure.ext || emptyObject
    this.x = valueOrGetToGet(configure.x)
    this.y = valueOrGetToGet(configure.y)
    if (configure.children) {
      this.appendList.collect(configure.children)
    }
  }
  getAbsolute(key: PointKey): number {
    return this.parent.getAbsolute(key) + this[key]()
  }
  public hasClip = false
  didDraw = false
  parent!: NodeParent
  setParent(
    parent: NodeParent,
    index: number
    // isBefore: boolean
  ) {
    if (this.parent && this.parent != parent) {
      throw 'parent发生改变'
    }
    this.parent = parent
    this._index = index
    // this.isBefore = isBefore
  }
  private _index: number = 0

  index() {
    /**
     * 使用这个可能就够了,children变化必然触发重绘
     * 因为所有操作都必须有实时性延迟,此时绘制已经完成了
     * 即如果更新到dom上,需要addEffect里面去操作
     */
    this.parent.children()
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
  path?: Path2D
}

interface CBaseNodeConfigure {
  skipDraw?(): any
  x: ValueOrGet<number>
  y: ValueOrGet<number>
  beforeChildren?(): void
  //这里可能有children()
  children?(): void
  mouseContainStroke?: boolean

  ext?: Record<string, any>
}

export type CNodePathConfigure = CBaseNodeConfigure & {
  withPath: true
  draw?(ctx: CanvaRenderCtx, path: Path2D): void

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
}
export type CNodeConfigure =
  | CNodePathConfigure
  | (CBaseNodeConfigure & {
      withPath?: never
      draw?(ctx: CanvaRenderCtx): void
    })

export type CanvasMouseEvent<T> = {
  x: number
  y: number
  inPath: boolean
  inStroke: boolean
  original: T
  node: CNode
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
    if (child.didDraw) {
      const nx = x - child.x()
      const ny = y - child.y()
      // will = doToEvent(_ctx, child.beforeChildren(), nx, ny, cs, callback)
      let tryChildren = true
      if (will && child.path) {
        //inPath,就是点在边界内
        const inPath = _ctx.isPointInPath(child.path, nx, ny)
        //inStroke,就是点恰好在边界中间,因为stroke在边界两边
        const inStroke = child.configure.mouseContainStroke
          ? _ctx.isPointInStroke(child.path, nx, ny)
          : false
        if (inPath || inStroke) {
          const e = {
            node: child,
            x: nx,
            y: ny,
            inPath,
            inStroke,
            original: undefined,
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
    }
    i++
  }
  return will
}

function doEvent(
  _ctx: CanvasRenderingContext2D,
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

const mouseEvents = (
  [
    'onClick',
    // 'onTouchDown', 'onTouchUp',
    'onMouseDown',
    'onMouseUp',
    'onPointerDown',
    'onPointerUp',
  ] as const
).map((name) => {
  return {
    name: name.slice(2).toLowerCase(),
    onEvent: name,
    onCaptureEvent: name + 'Capture',
  }
})

const devicePixelRatio = createSignal(window.devicePixelRatio || 1)
matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener(
  'change',
  (e) => {
    devicePixelRatio.set(window.devicePixelRatio)
    batchSignalEnd()
  }
)
export function renderCanvas(
  {
    width,
    height,
    ...args
  }: Omit<
    FDomAttributes<'canvas'>,
    'width' | 'height' | 's_width' | 's_height'
  > & {
    width: ValueOrGet<number>
    height: ValueOrGet<number>
  },
  children: SetValue<
    NodeParent & {
      canvas: HTMLCanvasElement
    }
  >,
  ext: Record<string, any> = emptyObject
) {
  const getWidth = valueOrGetToGet(width)
  const getHeight = valueOrGetToGet(height)
  const canvas = fdom.canvas({
    width() {
      return Math.floor(devicePixelRatio.get() * getWidth())
    },
    height() {
      return Math.floor(devicePixelRatio.get() * getHeight())
    },
    s_width() {
      return getWidth() + 'px'
    },
    s_height() {
      return getHeight() + 'px'
    },
    ...(args as any),
  })
  const rootParent: NodeParent & {
    canvas: HTMLCanvasElement
  } = {
    canvas,
    ext: ext,
    children: undefined as any,
    getAbsolute(key) {
      return 0
    },
  }
  const appendList = new AppendList<CNode, NodeParent>(
    rootParent,
    [],
    (list) => {
      list.forEach((row, index) => {
        row.setParent(rootParent, index)
      })
    }
  )
  appendList.collect(children as any)
  const getChildren = appendList.target
  rootParent.children = getChildren
  let _ctx: CanvasRenderingContext2D
  let _children: CNode[]
  mouseEvents.forEach((me) => {
    canvas.addEventListener(me.name as 'click', (e) => {
      doEvent(
        _ctx,
        _children,
        e.offsetX,
        e.offsetY,
        (child) => {
          const c = child as unknown as CanvasMouseEvent<MouseEvent>
          c.original = e
          const configure = child.node.configure
          if (configure.withPath) {
            return configure[me.onCaptureEvent as 'onClickCapture']?.(c)
          }
        },
        (child) => {
          const c = child as unknown as CanvasMouseEvent<MouseEvent>
          c.original = e

          const configure = child.node.configure
          if (configure.withPath) {
            return configure[me.onEvent as 'onClick']?.(c)
          }
        }
      )
    })
  })

  const mWidth = createSignal(canvas.width)
  const mHeight = createSignal(canvas.height)
  const ob = new ResizeObserver(() => {
    mWidth.set(canvas.width)
    mHeight.set(canvas.height)
    batchSignalEnd()
  })
  ob.observe(canvas)
  hookAddDestroy()(() => {
    ob.disconnect()
  })

  hookTrackSignal(() => {
    mHeight.get()
    mHeight.get()
    const ctx = canvas.getContext('2d')!
    const beforeCtx = m._mve_canvas_render_ctx
    m._mve_canvas_render_ctx = ctx
    function draw(children: CNode[]) {
      children.forEach((child) => {
        child.didDraw = false
        if (child.configure.skipDraw?.()) {
          return
        }
        child.didDraw = true
        const x = child.x()
        const y = child.y()
        //因为是累加的,所以返回
        ctx.translate(x, y)
        child.path = undefined
        if (child.configure.withPath) {
          const path = new Path2D()
          child.path = path
          const before = m._mve_canvas_render_current_Node
          m._mve_canvas_render_current_Node = child
          child.hasClip = false
          child.configure.draw?.(ctx, path)
          m._mve_canvas_render_current_Node = before
        } else {
          child.configure.draw?.(ctx)
        }
        draw(child.children())
        ctx.translate(-x, -y)
      })
    }
    ctx.reset()
    const scale = devicePixelRatio.get() // Change to 1 on retina screens to see blurry canvas.
    ctx.scale(scale, scale)
    ext.beforeDraw?.(ctx)
    draw(getChildren())
    _children = getChildren()
    _ctx = ctx
    m._mve_canvas_render_ctx = beforeCtx
  })
  return appendList
}

const m = globalThis as {
  _mve_canvas_render_ctx?: CanvaRenderCtx
  _mve_canvas_render_current_Node?: CNode
}

export function hookCurrentCtx() {
  return m._mve_canvas_render_ctx!
}

export function hookCurrentPath() {
  return m._mve_canvas_render_current_Node?.path!
}

export function hookClip(clipFillRule?: CanvasFillRule) {
  const ctx = m._mve_canvas_render_ctx!
  const node = m._mve_canvas_render_current_Node!
  ctx.clip(node.path!, clipFillRule)
  node.hasClip = true
}

export function hookTranslate(x: number, y: number, fun: EmptyFun) {
  const ctx = m._mve_canvas_render_ctx! as CanvasRenderingContext2D
  ctx.save()
  ctx.translate(x, y)
  fun()
  ctx.restore()
}

export function hookFill(style: CanvasStyle, value?: CanvasFillRule) {
  const ctx = m._mve_canvas_render_ctx!
  const path = m._mve_canvas_render_current_Node!.path!
  ctx.fillStyle = style
  ctx.fill(path, value)
}

export function hookStroke(width: number, value: CanvasStyle) {
  const ctx = m._mve_canvas_render_ctx!
  const path = m._mve_canvas_render_current_Node!.path!
  ctx.lineWidth = width
  ctx.strokeStyle = value
  ctx.stroke(path)
}
