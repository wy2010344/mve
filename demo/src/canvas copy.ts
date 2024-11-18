import { faker } from "@faker-js/faker";
import { hookAddResult, hookAlterChildren } from "mve-core";
import { dom } from "mve-dom";
import { hookTrackSignal, renderArray } from "mve-helper";
import { drawRoundedRect, RoundedRectParam, roundRect } from "wy-dom-helper";
import { createSignal, emptyArray, emptyFun, EmptyFun, getValueOrGet, memo, PointKey, quote, ValueOrGet } from "wy-helper";


/**
 * 先批量计算所有元素的children属性
 * 再批量计算每个元素各自的属性,其依赖父或子或其它属性,在计算中得到缓存,
 * 最后得到绘制
 * 
 * 即使使用react,虽然只render一次,但也需要通过遍历树来获得属性值.
 *  父节点如果依赖子节点的属性,则子节点的属性会提前计算并缓存起来,供子节点同时使用.
 *  子节点如何依赖父节点属性-当然父节点已经提供
 * 
 * 
 * 比如flex,子节点其实是父节点的构造入,主要是父节点下子节点的数量
 *  子节点运行时,判断父节点是哪种flex,父节点的子数量,自己在父节点中的顺序,来确定自己的位置.
 *    即如果自己要覆盖计算出来的位置,也是自己决定.
 *    或者flex对子节点的定位方式,是父节点提供过来的,子节点内部不处理flex定位
 * 
 * 决定位置的,父节点,自身(包括尺寸)
 * 决定尺寸的,父节点,自身,子节点
 * 
 * 父节点依赖子节点,方便
 * 子节点依赖父节点,向父节点询问的时候,需要带上自己的序号.通过这种最少依赖的询问,实现最大的自定义
 * 
 * 在绘制的时候必然遍历访问属性,访问属性都会计算,减少计算就要对流程memo化,即依赖相同则输出相同,减少如子节点已经计算则避免再计算
 * 如果有flex-grow,则有个本体宽度
 * 
 * 
 * 回归作为对canvas指令的收集.
 * 可能有对点击事件的分发.
 * 当然可以将绘制本身作为render,反复触发
 * 但预准备
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
  const getChildren = hookCanvasChildren(() => {
    renderArray(list.get, quote, row => {
      hookRect({
        width: 20,
        height: 30,
        x() {
          return 20 + row().index * 3
        },
        y() {
          return 30 + row().index * 5
        },
        draw(c, w) {
          const arg = {
            ...w
          } as RoundedRectParam
          roundRect(arg, 5)
          c.fillStyle = 'black'
          drawRoundedRect(c, arg)
          c.fill()
        },
      })
    })
  })

  // renderArray(getChildren, quote, (get) => {
  //   console.log("create")
  //   hookTrackSignal(memo(() => get().item), v => {
  //     console.log("ss", v)
  //   })
  // })

  hookTrackSignal(memo(() => {
    const ctx = canvas.getContext("2d")!
    ctx.reset()
    ctx.fillStyle = "green";
    ctx.fillRect(10, 10, 150, 100);
    ctx.font = "48px serif";
    ctx.strokeText(`Hello world ${count.get()} -- ${list.get().length}`, 10, 50);
    // 创建椭圆路径
    const ellipse = new Path2D();
    ellipse.ellipse(150, 75, 40, 60, Math.PI * 0.25, 0, 2 * Math.PI);
    ellipse.rect(150, 75, 40, 60);
    ctx.lineWidth = 25;
    ctx.strokeStyle = "red";
    ctx.fill(ellipse);
    ctx.stroke(ellipse);

    const children = getChildren()
    let currentX = 0
    let currentY = 0
    children.forEach(child => {
      const draw = child.draw
      if (draw) {
        const x = getValueOrGet(child.x)
        const y = getValueOrGet(child.y)
        ctx.translate(x - currentX, y - currentY)
        currentX = x
        currentY = y
        draw(ctx, {
          x,
          y,
          width: getValueOrGet(child.width),
          height: getValueOrGet(child.height)
        })
      }
    })
  }), emptyFun)
}


function hookRect(rect: Rect) {
  hookAddResult(rect)
}
type MyCtx = Omit<CanvasRenderingContext2D, 'translate'>


type PureRect = {
  x: number
  y: number
  width: number
  height: number
}

interface Rect {
  x: ValueOrGet<number>
  y: ValueOrGet<number>
  width: ValueOrGet<number>
  height: ValueOrGet<number>
  draw?(c: MyCtx, self: PureRect): void

  // borderTopLeftRadius: ValueOrGet<number>
  // borderTopRightRadius: ValueOrGet<number>
  // borderBottomLeftRadius: ValueOrGet<number>
  // borderBottomRightRadius: ValueOrGet<number>
}



export type CanvasChild = Rect | (() => CanvasChild[])

function hookCanvasChildren(fun: EmptyFun) {
  const list: CanvasChild[] = []
  const beforeList = hookAlterChildren(list)
  fun()
  hookAlterChildren(beforeList)
  return memo(() => {
    const newList: Rect[] = []
    purifyList(list, newList)
    return newList
  })
}
function purifyList(children: CanvasChild[], list: Rect[]) {
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
    return 'width'
  } else {
    return 'height'
  }
}

/**
 * 甚至更细化成两个接口
 */
interface CanvasParentNode {
  /**子节点询问父节点的建议 */
  getChildInfo(i: number, x: Info): number
}
interface CanvasNode {
  /**自身的尺寸位置信息 */
  getInfo(x: Info): number
  /**由自己的父容器或子容器提供的信息 */
  getPreferInfo(x: Info): number
}

type JustifyGap = {
  justifyContent: "start" | "center" | "end" | "match"
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
  direction: PointKey
  /**
   * match,是依赖子节点的宽度之和
   */
  alignItems: "start" | "center" | "end" | "stretch" | "match"
} & (JustifyGap | Justify)

abstract class FlexBox implements CanvasNode, CanvasParentNode {


  index: number = 0

  constructor(
    public readonly parent: CanvasParentNode,
    public readonly getFlex: () => FlexInfo,
    public readonly getChildren: () => CanvasNode[]
  ) { }

  getInfo(x: Info): number {
    /**
     * 用户自定义的部分,绝对的,相对偏移
     */
  }


  private getFlexPreferInfo(direction: PointKey) {
    const flex = this.getFlex()
    if (flex.direction == direction) {
      if (flex.justifyContent == 'match') {
        const gap = flex.gap || 0
        const sizeKey = directionToSize(direction)
        //随子容器
        let allWidth = this.getChildren().reduce((init, row) => {
          return init + row.getInfo(sizeKey) + gap
        }, 0)
        if (allWidth) {
          allWidth = allWidth - gap
        }
        return allWidth
      }
    } else {
      if (flex.alignItems == 'match') {
        const sizeKey = directionToSize(oppositeDirection(direction))
        return this.getChildren().reduce((init, row) => {
          return Math.max(init, row.getInfo(sizeKey))
        }, 0)
      }
    }
    throw new Error("no prefer info set")
  }
  getPreferInfo(x: Info): number {
    if (x == 'x') {
      return this.parent.getChildInfo(this.index, 'x')
    } else if (x == 'y') {
      return this.parent.getChildInfo(this.index, 'y')
    } else if (x == 'width') {
      return this.getFlexPreferInfo("x")
    } else if (x == 'height') {
      return this.getFlexPreferInfo("y")
    }
    throw new Error("no prefer info set")
  }

  getChildInfo(i: number, x: Info): number {
    if (x == 'x') {

    }
  }
}