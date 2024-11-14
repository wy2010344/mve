import { faker } from "@faker-js/faker";
import { hookAddResult, hookAlterChildren } from "mve-core";
import { dom } from "mve-dom";
import { hookTrackSignal, renderArray } from "mve-helper";
import { createSignal, emptyArray, EmptyFun, memo, quote } from "wy-helper";


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
 */

export default function () {


  const canvas = dom.canvas({
    width: 500,
    height: 500
  }).render()

  const ctx = canvas.getContext("2d")!

  const list = createSignal<number[]>([])
  dom.button({
    onClick() {
      list.set(list.get().concat(Date.now()))
    }
  }).renderText`列表数量${() => list.get().length}`
  const getChildren = hookCanvasChildren(() => {
    renderArray(list.get, quote, row => {
      hookAddResult({
        type: "rect",
        width: 20,
        height: 30,
        background: faker.color.rgb()
      })
    })
  })

  renderArray(getChildren, quote, (get) => {
    console.log("create")
    hookTrackSignal(memo(() => get().item), v => {
      console.log("ss", v)
    })
  })

  ctx.fillStyle = "green";
  ctx.fillRect(10, 10, 150, 100);
}




export type CanvasChild = Node | (() => CanvasChild[])

function hookCanvasChildren(fun: EmptyFun) {
  const list: CanvasChild[] = []
  const beforeList = hookAlterChildren(list)
  fun()
  hookAlterChildren(beforeList)
  return memo(() => {
    const newList: Node[] = []
    purifyList(list, newList)
    return newList
  })
}
function purifyList(children: CanvasChild[], list: Node[]) {
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (typeof child == 'function') {
      purifyList(child(), list)
    } else {
      list.push(child)
    }
  }
}



type Info = "width" | "height" | "x" | "y"
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
}


abstract class FlexBox implements CanvasNode, CanvasParentNode {


  constructor(
    public readonly getChildren: () => CanvasNode[]
  ) { }

  getInfo(x: Info): number {

  }

  getChildInfo(i: number, x: Info): number {

  }
}