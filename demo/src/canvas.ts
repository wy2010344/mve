import { faker } from "@faker-js/faker";
import { dir } from "console";
import { hookAddResult, hookAlterChildren } from "mve-core";
import { dom } from "mve-dom";
import { hookTrackSignal, renderArray } from "mve-helper";
import { drawRoundedRect, RoundedRectParam, roundRect } from "wy-dom-helper";
import { createSignal, emptyArray, emptyFun, EmptyFun, GetValue, getValueOrGet, memo, PointKey, Quote, quote, ValueOrGet } from "wy-helper";

class MemoInfo {
  private symbol!: Symbol
  refresh() {
    this.symbol = Symbol()
  }
  cacheGet<T>(get: GetValue<T>) {
    let lastValue: T
    let lastSymbol: Symbol
    return () => {
      if (lastSymbol != this.symbol) {
        lastValue = get()
        lastSymbol = this.symbol
      }
      return lastValue
    }
  }
}
/**
 * 因为绘制必然会遍历属性
 * 访问属性,在遍历时触发,通过get
 * 
 * flex的子元素,面临比例问题
 * flex大部分时候会变形,所以只是减少绝对定位的计算
 * 简单点,child没有自己的size,则父节点设置size
 * 从根向叶子遍历
 */
export default function () {


  const canvas = dom.canvas({
    width: 500,
    height: 500
  }).render()
  const list = createSignal<number[]>([])
  const count = createSignal(0)
  dom.button({
    onClick() {
      list.set(list.get().concat(Date.now()))
      count.set(count.get() + 1)
    }
  }).renderText`列表数量${() => list.get().length}`
  const getChildren = canvasChildren(() => {
    hookRect({
      attr() {
        const n: Attr = {
          x(n) {
            return n + 5 + 100
          },
          y(n) {
            return n + 5
          },
          width(n) {
            return n - 250
          },
          height(n) {
            return n - 30
          }
        }
        n.borderWidth = 10
        n.borderStyle = '#00000030'
        n.fillStyle = '#ff00002e'
        n.borderTopLeftRadius = 20
        return n
      },
      draw(c, w) {
      },
      children() {
        hookRect({
          attr: {
            x: 10,
            y: 10,
            width: 40,
            height: 40,
            borderWidth: 2,
            borderStyle: 'green'
          }
        })

        hookRect({
          attr: {
            x: 40,
            y: 40,
            width: 200,
            height: 200,
            borderWidth: 2,
            borderStyle: 'blue',
            display: flex({
              justifyContent: "between",
              alignItems: "center"
            }),
          },
          children() {
            hookRect({
              attr: {
                width: 40,
                height: 40,
                borderWidth: 2,
                borderStyle: 'green'
              }
            })


            hookRect({
              attr: {
                width: 40,
                height: 40,
                borderWidth: 2,
                borderStyle: 'green'
              }
            })
          }
        })
        renderArray(list.get, quote, getRow => {
          hookRect({
            attr() {
              const n: Attr = {}
              n.width = 50
              n.height = 30

              return n
            }
          })
        })
      },
    })
  })


  hookTrackSignal(memo(() => {
    const ctx = canvas.getContext("2d")!
    ctx.reset()
    function draw(
      children: CNode[],
      parent?: CNode
    ) {
      children.forEach((child, i) => {
        child.index = i
        child.parent = parent
        child.ctx = ctx
        child.refresh()
        const x = child.x()
        const y = child.y()
        child.draw(ctx)
        //因为是累加的,所以返回
        ctx.translate(x, y)
        draw(
          child.children(),
          child
        )
        ctx.translate(-x, -y)
      })
    }
    draw(getChildren())
  }), emptyFun)
}


function hookRect(rect: Rect) {
  hookAddResult(new CNode(rect))
}

class CNode extends MemoInfo {
  constructor(
    public readonly rect: Rect
  ) {
    super()
    this.children = canvasChildren(rect.children || emptyFun)
    this.attr = this.cacheGet(() => {
      return getValueOrGet(this.rect.attr)
    })
  }
  public readonly attr: GetValue<Attr>
  public parent?: CNode
  public index: number = 0
  public ctx!: CanvasRenderingContext2D


  
  x = this.cacheGet(() => {
    const x = this.attr().x
    const tp = typeof x
    if (tp == 'number') {
      return x as number
    } else if (tp == 'function') {
      return (x as any)(this.parent?.getDisplayInfo('x', this.index) || 0)
    } else if (!this.parent) {
      return 0
    }
  })
  y = this.cacheGet(() => {
    const x = this.attr().y || 0
    const tp = typeof x
    if (tp == 'number') {
      return x as number
    } else if (tp == 'function') {
      return (x as any)(this.parent?.getDisplayInfo('y', this.index) || 0)
    } else if (!this.parent) {
      return 0
    }
    return this.parent.getDisplayInfo('y', this.index)
  })

  width = this.cacheGet(() => {
    const x = this.attr().width
    const tp = typeof x
    if (tp == 'number') {
      return x as number
    } else if (tp == 'function') {
      return (x as any)(this.parent?._getChildInfo().info('width') || this.ctx.canvas.width)
    } else if (!this.parent) {
      return this.ctx.canvas.width
    }
    return this._getChildInfo().info("width")
  })

  height = this.cacheGet(() => {
    const x = this.attr().height
    const tp = typeof x
    if (tp == 'number') {
      return x as number
    } else if (tp == 'function') {
      return (x as any)(this.parent?._getChildInfo().info('height') || this.ctx.canvas.height)
    } else if (!this.parent) {
      return this.ctx.canvas.height
    }
    return this._getChildInfo().info("height")
  })
  private _getChildInfo = this.cacheGet(() => {
    const display = this.attr().display
    if (display) {
      return display(this)
    }
    throw '需要子节点自己定义位置'
  })
  readonly children: GetValue<CNode[]>
  draw(ctx: MyCtx) {
    const r = this.attr()
    drawRoundedRect(ctx, {
      x: this.x(),
      y: this.y(),
      width: this.width(),
      height: this.height(),
      bl: r.borderBottomLeftRadius || 0,
      br: r.borderBottomRightRadius || 0,
      tl: r.borderTopLeftRadius || 0,
      tr: r.borderTopRightRadius || 0
    })
    if (r.borderWidth && r.borderStyle) {
      ctx.strokeStyle = r.borderStyle
      ctx.lineWidth = r.borderWidth
      ctx.stroke()
    }
    if (r.fillStyle) {
      ctx.fillStyle = r.fillStyle
      ctx.fill()
    }
  }

}
type MyCtx = Omit<CanvasRenderingContext2D, 'translate'>


type PureRect = {
  x: number
  y: number
  width: number
  height: number
}


type DisplayInfo = {
  childInfo(index: number, i: Info): number
  info(i: SizeKey): number
}

/**
 * 因为整体在render中,要么relayParent(就是函数),要么绝对(就是数字)
 */
type Attr = {
  display?(arg0: CNode): DisplayInfo;

  x?: Quote<number> | number
  y?: Quote<number> | number
  /**
   * 子决定尺寸、自己决定尺寸最优先
   * 子决定尺寸:自己的布局之后,再转化
   */
  width?: Quote<number> | number
  height?: Quote<number> | number


  borderTopLeftRadius?: number
  borderTopRightRadius?: number
  borderBottomLeftRadius?: number
  borderBottomRightRadius?: number
  borderStyle?: string
  borderWidth?: number
  fillStyle?: string

  /**伸缩度,由父决定尺寸 */
  flex?: number
  /**如果有自己的flex-alignSelf,由父决定尺寸 */
  alignSelf?: Quote<number>
}
interface Rect {
  attr: ValueOrGet<Attr>
  draw?(c: MyCtx, self: PureRect): void
  //这里可能有children()
  children?(): void
}

export type CanvasChild = CNode | (() => CanvasChild[])

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


type SizeKey = "width" | "height"

type Info = SizeKey | PointKey

function directionToSize(x: PointKey): SizeKey {
  if (x == 'x') {
    return "width"
  } else {
    return "height"
  }
}
function oppositeDirection(x: PointKey): PointKey {
  if (x == 'x') {
    return 'y'
  } else {
    return 'x'
  }
}
function oppositeSize(x: SizeKey): SizeKey {
  if (x == 'width') {
    return 'height'
  } else {
    return 'width'
  }
}

// function cacheMemo() {
//   let current: Symbol
//   return [
//     function <T>(get: GetValue<T>) {
//       let lastValue: T
//       let lastSymbol: Symbol
//       return function () {
//         if (lastSymbol != current) {
//           lastValue = get()
//           lastSymbol = current
//         }
//         return lastValue
//       }
//     },
//     function () {
//       current = Symbol()
//     }
//   ] as const
// }


function flex(arg: FlexInfo) {

  return function (n: CNode): DisplayInfo {
    return new FlexDisplayInfo(n, arg)
  }
}
type JustifyGap = {
  /**
   * match,匹配所有子节点的和
   * grow,子节点有伸缩度
   */
  justifyContent: "start" | "center" | "end" | "match" | "grow"
  gap?: number
}
type Justify = {
  /**
   * evenly:左右与间隔相等
   * around:左右是间隔的一半,
   * gap可以为负
   */
  justifyContent: "between" | "evenly" | "around"
  gap?: never
}
type FlexInfo = {
  direction?: 'x' | 'y'
  /**
   * match,是依赖子节点的宽度之和
   */
  alignItems: "start" | "center" | "end" | "stretch" | "match"
} & (JustifyGap | Justify)



class FlexDisplayInfo implements DisplayInfo {
  constructor(
    public readonly node: CNode,
    public readonly arg: FlexInfo
  ) {
    const direction = arg.direction || 'x'
    const odirection = oppositeDirection(direction)

    const gap = arg.gap || 0
    const justifyContent = arg.justifyContent
    if (justifyContent == 'start') {

    } else if (justifyContent == 'around') {

    } else if (justifyContent == 'between') {
      const s = directionToSize(direction)
      const allWidth = node.children().reduce((init, row) => {
        if (row.fromParent(s)) {
          throw '不支持从父节点获得尺寸'
        }
        const w = row[s]()
        return init + w
      }, 0)
      const list = [0]
      if (node.children().length > 1) {
        const r = (node.width() - allWidth) / node.children().length - 1
        node.children().reduce((init, row) => {
          init.push(r + row.width())
          return init
        }, list)
      }
      const os = directionToSize(odirection)
      const maxSize = node.children().reduce((init, row) => {
        if (row.fromParent(os)) {
          return init
        }
        return Math.max(init, row[os]())
      }, 0)

      this.childInfo = (index, i) => {
        if (i == direction) {
          return list[index]
        } else if (i == odirection) {

        } else {
          throw '不支持'
        }
      }
    }
  }
  childInfo(index: number, i: Info): number {
    throw 'no support'
  }
  info(i: SizeKey): number {
    throw 'no support'
  }
}