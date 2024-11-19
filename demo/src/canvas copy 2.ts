import { hookAddResult, hookAlterChildren } from "mve-core";
import { dom } from "mve-dom";
import { hookTrackSignal, renderArray } from "mve-helper";
import { drawRoundedRect } from "wy-dom-helper";
import { createSignal, emptyFun, EmptyFun, GetValue, getValueOrGet, memo, PointKey, Quote, quote, ValueOrGet } from "wy-helper";

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
 * 不能在flex定位了size后再size,有偏移
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
          x: 105,
          y: 5,
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
            borderStyle: 'blue'
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
    function prepare(children: CNode[], parent?: CNode) {
      children.forEach((child, i) => {
        child.index = i
        child.parent = parent
        child.ctx = ctx
        child.refresh()
        prepare(child.children(), child)
      })
    }
    prepare(getChildren())

    function draw(
      children: CNode[]
    ) {
      children.forEach((child, i) => {
        const x = child.x
        const y = child.y
        child.draw(ctx)
        //因为是累加的,所以返回
        ctx.translate(x, y)
        child.layout()
        draw(child.children())
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
  children_sum_width?: number
  children_sum_height?: number
  children_max_width?: number
  children_max_height?: number

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
  /**
   * x与y由parent写入
   */
  x = 0
  y = 0
  width!: number
  height!: number

  readonly children: GetValue<CNode[]>
  draw(ctx: MyCtx) {
    const r = this.attr()
    drawRoundedRect(ctx, {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
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


/**
 * 因为整体在render中,要么relayParent(就是函数),要么绝对(就是数字)
 */
type Attr = {
  display?: 'flex' | 'zstack'
  zstackX?: 'center' | 'left' | 'right'
  zstackY?: 'center' | 'top' | 'right'

  flexDirection?: 'x' | 'y'
  flexJustifyContent?: 'center' | 'start' | 'end' | 'between' | 'evenly' | 'around'
  flexGap?: number
  flexAlignItems?: 'center' | 'start' | 'end'
  /**
   * relative是相对叠加偏移
   * absolute是绝对定位,脱离布局
   */
  position?: 'relative' | 'absolute'
  x?: number
  y?: number
  /**
   * Quote:相对于父的百分比例
   * 为什么使用Quote<number>?总涉及计算calc
   * 其实就是与alignItem:stretch相关了
   * flex也相关,则如果没有比例,会依flex的伸缩度
   * 
   * 如果是子容器决定尺寸,是固定的,受子容器总和+padding
   * 如果width/height都没有,则是受子容器影响
   */
  width?: Quote<number> | number
  height?: Quote<number> | number
  /**伸缩度,由父决定尺寸 */
  flex?: number


  borderTopLeftRadius?: number
  borderTopRightRadius?: number
  borderBottomLeftRadius?: number
  borderBottomRightRadius?: number
  borderStyle?: string
  borderWidth?: number
  fillStyle?: string

  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
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
