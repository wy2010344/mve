import { hookAddResult, hookAlterChildren } from "mve-core";
import { dom } from "mve-dom";
import { hookTrackSignal, renderArray } from "mve-helper";
import { drawRoundedRect } from "wy-dom-helper";
import { constraintEvaluation, ConstraintResult, createSignal, emptyFun, EmptyFun, GetValue, getValueOrGet, memo, PointKey, Quote, quote, ValueOrGet } from "wy-helper";

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

  const resultSet = new Set<ConstraintResult<number>>()
  const calculates = new Set<EmptyFun>()
  function addResult(n: ConstraintResult<number>) {
    n.reset()
    resultSet.add(n)
  }
  hookTrackSignal(memo(() => {
    const ctx = canvas.getContext("2d")!
    resultSet.clear()
    calculates.clear()
    function prepare(children: CNode[], parent?: CNode) {
      children.forEach((child, i) => {
        child.index = i
        child.parent = parent
        child.ctx = ctx
        child.refresh()
        addResult(child.x)
        addResult(child.y)
        addResult(child.width)
        addResult(child.height)
        child.insertRules(calculates)
        prepare(child.children(), child)
      })
    }
    prepare(getChildren())
    constraintEvaluation(calculates, resultSet)
    function draw(
      children: CNode[]
    ) {
      children.forEach((child, i) => {
        const x = child.x.get()
        const y = child.y.get()
        child.draw(ctx)
        //因为是累加的,所以返回
        ctx.translate(x, y)

        draw(child.children())
        ctx.translate(-x, -y)
      })
    }
    ctx.reset()
    draw(getChildren())
  }), emptyFun)
}


function hookRect(rect: Rect) {
  hookAddResult(new CNode(rect))
}


function setPosition(direction: PointKey, child: CNode, ca: Attr, start: number,) {
  if (ca.position == 'absolute') {
    child[direction].set(start, true)
  } else {
    child[direction].set(start + (ca[direction] || 0))
  }
}
function layoutFlexBegin(
  cs: CNode[],
  direction: PointKey,
  attr: Attr,
  size: SizeKey,
  gap: number
) {

  const pstart = gatPaddingStart(direction, attr)
  let all = pstart
  cs.forEach(child => {
    const car = child.attr()
    setPosition(direction, child, car, all)
    if (car.position == 'relative') {
      all = all + child[size].get() + gap
    }
  })
  return all - pstart
}
class CNode extends MemoInfo {
  constructor(
    public readonly rect: Rect
  ) {
    super()
    this.children = canvasChildren(rect.children || emptyFun)
    this.attr = this.cacheGet(() => {
      const attr = getValueOrGet(this.rect.attr)
      attr.position = attr.position || 'relative'
      attr.display = attr.display || 'flex'

      attr.paddingLeft = attr.paddingLeft || 0
      attr.paddingRight = attr.paddingRight || 0
      attr.paddingTop = attr.paddingTop || 0
      attr.paddingBottom = attr.paddingBottom || 0

      if (attr.display == 'flex') {
        attr.flexDirection = attr.flexDirection || 'x'
        attr.flexJustifyContent = attr.flexJustifyContent || 'gap'
        attr.flexGap = attr.flexGap || 0
        attr.flexAlignItems = attr.flexAlignItems || 'center'
        attr.flexAlignGrow = attr.flexAlignGrow || 'none'
        if (typeof attr.flex == 'number' && attr.flex <= 0) {
          throw 'flex必须为正数'
        } else {
          attr.flex = undefined
        }
      }
      return attr
    })
  }
  public readonly attr: GetValue<Attr>
  public parent?: CNode
  public index: number = 0
  public ctx!: CanvasRenderingContext2D
  /**
   * x与y由parent写入
   */
  x = new ConstraintResult<number>()
  y = new ConstraintResult<number>()
  width = new ConstraintResult<number>()
  height = new ConstraintResult<number>()
  insertRules(calculates: Set<EmptyFun>) {
    this.insertSize('x', calculates)
    this.insertSize('y', calculates)
    const it = this

    calculates.add(() => {
      const attr = this.attr()
      const display = attr.display!

      if (display == 'flex') {
        const direction = attr.flexDirection!
        const gap = attr.flexGap!
        const size = directionToSize(direction)
        if (attr.flexJustifyContent == 'gap' && !this.children().some(v => {
          const attr = v.attr()
          return attr.position == 'relative' && attr.flex
        })) {
          //子扩展父,gap,且子元素无flex
          calculates.add(() => {
            let all = layoutFlexBegin(it.children(), direction, attr, size, gap)
            if (all) {
              all = all - gap
            }
            it[size].set(all + getPadding(direction, attr))
          })
        } else {
          //父宽度约束子
          calculates.add(() => {
            const allSize = it[size].get()
            if (attr.flexJustifyContent == 'start') {
              layoutFlexBegin(it.children(), direction, attr, size, gap)
            } else {
              if (attr.flexJustifyContent == 'gap') {
                let allChildrenSize = 0
                let allFlex = 0
                it.children().forEach(child => {
                  const ca = child.attr()
                  if (ca.position == 'relative') {
                    if (ca.flex) {
                      allFlex += ca.flex
                    } else {
                      allChildrenSize += child[size].get() + gap
                    }
                  }
                })
                if (allChildrenSize) {
                  allChildrenSize -= gap
                }
                let remaing = allSize - getPadding(direction, attr) - allChildrenSize
                if (allFlex <= 0) {
                  throw '总和应该大于0'
                }
                let start = 0
                it.children().forEach(child => {
                  const ca = child.attr()
                  //这里要细化
                  setPosition(direction, child, ca, start + gatPaddingStart(direction, attr))
                  if (ca.position == 'relative') {
                    if (ca.flex) {
                      child[size].set(ca.flex * remaing / allFlex)
                    }
                    start = start + child[size].get()
                  }
                })
              } else {
                //其它几种
              }
            }
          })
        }

        const pdirection = oppositeDirection(direction)
        const osize = directionToSize(pdirection)
        if (attr.flexAlignGrow == 'grow') {
          //子撑开父
          calculates.add(() => {
            let maxSize = 0
            it.children().forEach(child => {
              const ca = child.attr()
              if (ca.position == 'relative') {
                maxSize = Math.max(maxSize, child[osize].get())
              }
            })
            it[osize].set(maxSize + getPadding(pdirection, attr))
          })
        }

        //父影响子
        calculates.add(() => {
          const pstart = gatPaddingStart(pdirection, attr)
          if (attr.flexAlignItems == 'start') {
            it.children().forEach(child => {
              const ca = child.attr()
              setPosition(pdirection, child, ca, pstart)
            })
          } else {
            const centerSize = it[osize].get() - getPadding(pdirection, attr)
            if (attr.flexAlignItems == 'center') {
              it.children().forEach(child => {
                const ca = child.attr()
                const csize = child[osize].get()
                setPosition(pdirection, child, ca, pstart + ((centerSize - csize) / 2))
              })
            } else if (attr.flexAlignItems == 'end') {
              it.children().forEach(child => {
                const ca = child.attr()
                const csize = child[osize].get()
                setPosition(pdirection, child, ca, pstart + centerSize - csize)
              })
            }
          }
        })
      }
    })
  }
  readonly children: GetValue<CNode[]>
  draw(ctx: MyCtx) {
    const r = this.attr()
    drawRoundedRect(ctx, {
      x: this.x.get(),
      y: this.y.get(),
      width: this.width.get(),
      height: this.height.get(),
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


  private insertSize(key: PointKey, calculates: Set<EmptyFun>) {
    const it = this
    const sizeKey = directionToSize(key)
    calculates.add(() => {
      const attr = it.attr()
      if (attr.position == 'absolute') {
        const loc = attr[key]
        if (typeof loc == 'number') {
          it[key].set(loc)
        }
      }
    })
    calculates.add(() => {
      const attr = it.attr()
      const size = attr[sizeKey]
      const tw = typeof size
      if (tw == 'number') {
        it[key].set(size as number)
      } else if (tw == 'function') {
        calculates.add(() => {
          let pw = 0
          if (it.parent) {
            pw = it.parent[key].get()
          } else {
            pw = it.ctx.canvas.width
          }
          it[sizeKey].set((size as any)(pw))
        })
      }
    })
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
  /**
   * gap,就是撑开容器,但如果children里面有grow,就是占据剩余容器
   */
  flexJustifyContent?: 'gap' | 'center' | 'start' | 'end' | 'between' | 'evenly' | 'around'
  flexGap?: number
  /**
   * grow,就是撑开容器
   * 这个方向上,children不能有百分比
   */
  flexAlignItems?: 'center' | 'start' | 'end'
  flexAlignGrow?: 'grow' | 'none'
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
} & PaddingInfo
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


type PaddingInfo = {
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
}
function getPadding(n: PointKey, x: PaddingInfo) {
  if (n == 'x') {
    return (x.paddingLeft!) + (x.paddingRight!)
  } else {
    return (x.paddingTop!) + (x.paddingBottom!)
  }
}
function gatPaddingStart(n: PointKey, x: PaddingInfo) {
  if (n == 'x') {
    return x.paddingLeft!
  } else {
    return x.paddingTop!
  }
}