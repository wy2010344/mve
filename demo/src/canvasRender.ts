import { hookAddResult, hookAlterChildren } from "mve-core"
import { hookTrackSignalMemo } from "mve-helper"
import { path2DOperate, Path2DOperate } from "wy-dom-helper"
import { asLazy, emptyArray, emptyFun, EmptyFun, GetValue, memo, PointKey, ValueOrGet } from "wy-helper"

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
      this.beforeChildren = canvasChildren(configure.beforeChildren)
    } else {
      this.beforeChildren = asLazy(emptyArray as any[])
    }
    if (configure.children) {
      this.children = canvasChildren(configure.children)
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

      will = doToEvent(child.beforeChildren(), nx, ny, cs, callback)

      if (will && child.path && (_ctx.isPointInPath(child.path, nx, ny) || _ctx.isPointInStroke(child.path, nx, ny))) {
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
        return child.configure.onClickCapture?.(e)
      },
      child => {
        return child.configure.onClick?.(e)
      }
    )
  })
  hookTrackSignalMemo(() => {
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
}