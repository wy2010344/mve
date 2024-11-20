import { hookAddResult, hookAlterChildren } from "mve-core"
import { hookTrackSignal } from "mve-helper"
import { path2DOperate, Path2DOperate } from "wy-dom-helper"
import { asLazy, emptyArray, emptyFun, EmptyFun, GetValue, memo, PointKey, ValueOrGet } from "wy-helper"

export function hookRect(rect: Rect | ((c: CMNode) => Rect)) {
  const n = new CNode()
  if (typeof rect == 'function') {
    n.setRect(rect(n))
  } else {
    n.setRect(rect)
  }
  hookAddResult(n)
}

type MyCtx = Omit<CanvasRenderingContext2D, 'translate' | 'reset' | 'save' | 'restore'>
function toCall(rect: Rect, key: PointKey) {
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
  private rect?: Rect

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

  x!: GetValue<number>
  y!: GetValue<number>
  children!: GetValue<CNode[]>

  setRect(rect: Rect) {
    if (this.rect) {
      throw '禁止重复写入'
    }
    if (!rect) {
      throw '禁止写入空'
    }
    this.x = toCall(rect, 'x')
    this.y = toCall(rect, 'y')
    this.rect = rect
    if (rect.children) {
      this.children = canvasChildren(rect.children)
    } else {
      this.children = asLazy(emptyArray as any[])
    }
  }
  getRect() {
    return this.rect!
  }

  path!: Path2D
}
interface Rect {
  x: ValueOrGet<number>
  y: ValueOrGet<number>
  path?(): PathResult

  draw?(ctx: MyCtx): void
  //这里可能有children()
  children?(): void

  onClick?(e: MouseEvent): any
  onClickCapture?(e: MouseEvent): any
}

export type PathResult = {
  path: Path2D
  operates?: Path2DOperate[]
}

type CanvasChild = CNode | (() => CanvasChild[])


function purifyList(children: CanvasChild[], list: CNode[]) {
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (typeof child == 'function') {
      purifyList(child(), list)
    } else {
      list.push(child)
    }
  }
}




function canvasChildren(fun: EmptyFun) {
  const list: CanvasChild[] = []
  const beforeList = hookAlterChildren(list)
  fun()
  hookAlterChildren(beforeList)
  return memo(() => {
    const newList: CNode[] = []
    purifyList(list, newList)
    return newList
  })
}

export function renderCanvas(
  canvas: HTMLCanvasElement,
  children: EmptyFun
) {
  const getChildren = canvasChildren(children)
  let _ctx: CanvasRenderingContext2D
  let _children: CNode[]

  function doToEvent(
    children: CNode[],
    x: number,
    y: number,
    cs: CNode[],
    callback: (child: CNode) => any
  ): boolean {
    let will = true
    let i = 0
    while (will && i < children.length) {
      const child = children[i]
      const nx = x - child.x()
      const ny = y - child.y()
      if (_ctx.isPointInPath(child.path, nx, ny) || _ctx.isPointInStroke(child.path, nx, ny)) {
        cs.unshift(child)
        if (callback(child)) {
          will = false
          cs.length = 0
        }
      }
      if (will) {
        will = doToEvent(child.children(), nx, ny, cs, callback)
        i++
      }
    }
    return will
  }

  function doEvent(
    children: CNode[],
    x: number,
    y: number,
    capture: (child: CNode) => any,
    back: (child: CNode) => any
  ) {
    const cs: CNode[] = []
    doToEvent(children, x, y, cs, capture)
    for (let i = 0; i < cs.length; i++) {
      if (back(cs[i])) {
        return
      }
    }
  }
  canvas.addEventListener("click", e => {
    doEvent(
      _children,
      e.offsetX,
      e.offsetY,
      child => {
        return child.getRect().onClickCapture?.(e)
      },
      child => {
        return child.getRect().onClick?.(e)
      }
    )
  })
  hookTrackSignal(memo(() => {
    const ctx = canvas.getContext("2d")!
    function prepare(getChildren: GetValue<CNode[]>, parent?: CNode) {
      getChildren().forEach((child, i) => {
        child.ctx = ctx
        child.setParentAndIndex(getChildren, i, parent)
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
        const rect = child.getRect()
        ctx.save()
        //因为是累加的,所以返回
        ctx.translate(x, y)
        if (rect) {
          const path = rect.path?.()
          if (path) {
            child.path = path.path
            path2DOperate(ctx, path.path, path.operates || emptyArray)
          }
          rect.draw?.(ctx)
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
  }), emptyFun)
}