import {
  AppendList,
  hookAddDestroy,
  hookAddResult,
  hookCurrentParent,
} from 'mve-core'
import { hookTrackSignal } from 'mve-helper'
import { CanvasStyle } from 'wy-dom-helper/canvas'
import {
  batchSignalEnd,
  createSignal,
  EmptyFun,
  emptyObject,
  GetValue,
  PointKey,
  removeEqual,
  SetValue,
  ValueOrGet,
  valueOrGetToGet,
} from 'wy-helper'

export function hookDraw(rect: CNodeConfigure) {
  const parent = hookCurrentParent() as NodeParent
  const n = new CNode(rect, parent)
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
  private appendList = new AppendList<CNode, CNode>(this, (list) => {
    list.forEach((row, index) => {
      row._index = index
    })
  })
  children = this.appendList.target
  collect<T = void>(fun: (n: CNode) => T) {
    return this.appendList.collect(fun)
  }
  constructor(readonly configure: CNodeConfigure, readonly parent: NodeParent) {
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
  _index: number = 0

  index() {
    /**
     * 使用这个可能就够了,children变化必然触发重绘
     * 因为所有操作都必须有实时性延迟,此时绘制已经完成了
     * 即如果更新到dom上,需要addEffect里面去操作
     */
    this.parent.children()
    return this._index
  }
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

export type DrawArg = {
  node: CMNode
  ctx: CanvaRenderCtx
}

export type DrawArgWithPath = DrawArg & {
  path: Path2D
}
export type CNodePathConfigure = CBaseNodeConfigure & {
  withPath: true
  draw?(arg: DrawArgWithPath): void

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
      draw?(ctx: DrawArg): void
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
  original: any,
  children: CNode[],
  x: number,
  y: number,
  cs: CanvasMouseEvent<undefined>[],
  captureEventKey: 'onClickCapture',
  eventKey: 'onClick'
): boolean {
  let will = true
  let i = children.length - 1
  while (will && i > -1) {
    const child = children[i]
    const subChildren = child.children()
    let captureEvent: ((e: CanvasMouseEvent<MouseEvent>) => any) | undefined =
      undefined
    let event: ((e: CanvasMouseEvent<MouseEvent>) => any) | undefined =
      undefined
    if (child.configure.withPath) {
      captureEvent = child.configure[captureEventKey]
      event = child.configure[eventKey]
    }
    const nx = x - child.x()
    const ny = y - child.y()
    let tryChildren = subChildren.length > 0
    if (child.didDraw && child.path && (captureEvent || event || tryChildren)) {
      //没有跳过绘制、有path,有相应的事件或children
      //inPath,就是点在边界内
      const scale = devicePixelRatio.get()
      const sx = nx * scale
      const sy = ny * scale
      const inPath = _ctx.isPointInPath(child.path, sx, sy)
      //inStroke,就是点恰好在边界中间,因为stroke在边界两边
      const inStroke = child.configure.mouseContainStroke
        ? _ctx.isPointInStroke(child.path, sx, sy)
        : false
      if (inPath || inStroke) {
        if (captureEvent || event) {
          const e = {
            original,
            node: child,
            x: nx,
            y: ny,
            inPath,
            inStroke,
          }
          if (event) {
            cs.push(e)
          }
          if (captureEvent && captureEvent(e)) {
            //有事件并阻止
            will = false
            cs.length = 0
          }
        }
      } else if (child.hasClip) {
        tryChildren = false
      }
    }

    if (will && tryChildren) {
      will = doToEvent(
        _ctx,
        original,
        subChildren,
        nx,
        ny,
        cs,
        captureEventKey,
        eventKey
      )
    }
    i--
  }
  return will
}
function doEvent(
  _ctx: CanvasRenderingContext2D,
  e: any,
  children: CNode[],
  x: number,
  y: number,
  captureEventKey: 'onClickCapture',
  eventKey: 'onClick'
) {
  const cs: CanvasMouseEvent<undefined>[] = []
  doToEvent(_ctx, e, children, x, y, cs, captureEventKey, eventKey)
  for (let i = cs.length - 1; i > -1; i--) {
    const c = cs[i]
    const event = (c.node.configure as any)[eventKey]
    if (event && event(c)) {
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

const ctxs: CanvasRenderingContext2D[] = []
export function getOneCtx() {
  return ctxs[0]
}
/**
 *
 * @param canvas 注意这个canvas不能绑定width与height,可以绑定style.width或style.height
 * @param children
 * @param ext
 * @returns
 */
export function renderCanvas(
  canvas: HTMLCanvasElement,
  children: SetValue<
    NodeParent & {
      canvas: HTMLCanvasElement
    }
  >,
  /**
   * beforeDraw
   */
  ext: {
    //怎么感觉这个translateX又不如预期,不如在beforeDraw时ctx.translate
    translateX?: ValueOrGet<number>
    translateY?: ValueOrGet<number>

    beforeDraw?(ctx: CanvasRenderingContext2D): void
    afterDraw?(ctx: CanvasRenderingContext2D): void
  } = emptyObject
) {
  const translateX = valueOrGetToGet(ext.translateX || 0)
  const translateY = valueOrGetToGet(ext.translateY || 0)
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
  const appendList = new AppendList<CNode, NodeParent>(rootParent, (list) => {
    list.forEach((row, index) => {
      row._index = index
    })
  })
  appendList.collect(children as any)
  const getChildren = appendList.target
  rootParent.children = getChildren
  let _ctx: CanvasRenderingContext2D
  let _children: CNode[]
  mouseEvents.forEach((me) => {
    canvas.addEventListener(me.name as 'click', (e) => {
      doEvent(
        _ctx,
        e,
        _children,
        e.offsetX + translateX(),
        e.offsetY + translateY(),
        me.onCaptureEvent as 'onClickCapture',
        me.onEvent as 'onClick'
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
    removeEqual(ctxs, ctx)
  })
  const ctx = canvas.getContext('2d')!
  ctxs.push(ctx)
  hookTrackSignal(() => {
    mHeight.get()
    mHeight.get()
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
        ctx.save()
        ctx.translate(x, y)
        child.path = undefined
        const before = m._mve_canvas_render_current_Node
        m._mve_canvas_render_current_Node = child
        if (child.configure.withPath) {
          const path = new Path2D()
          child.path = path
          child.hasClip = false
          child.configure.draw?.({
            node: child,
            ctx,
            path,
          })
        } else {
          child.configure.draw?.({
            node: child,
            ctx,
          })
        }
        m._mve_canvas_render_current_Node = before
        draw(child.children())
        ctx.restore()
      })
    }
    ctx.reset()
    const scale = devicePixelRatio.get() // Change to 1 on retina screens to see blurry canvas.
    canvas.width = canvas.clientWidth * scale
    canvas.height = canvas.clientHeight * scale
    ctx.scale(scale, scale)
    ctx.translate(translateX(), translateY())
    ext.beforeDraw?.(ctx)
    draw(getChildren())
    ext.afterDraw?.(ctx)
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
