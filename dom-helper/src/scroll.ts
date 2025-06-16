import { hookDestroy } from "mve-helper"
import { animateSignal, pointerMove, pointerMoveDir } from "wy-dom-helper"
import { AnimateSignal, AnimateSignalConfig, ClampingScrollFactory, createSignal, DeltaXSignalAnimationConfig, destinationWithMargin, eventGetPageX, eventGetPageY, getMaxScroll, GetValue, PointKey, scrollForEdge, ScrollFromPage, SetValue, storeRef, StoreRef } from "wy-helper"




export interface OnScrollI {
  container: HTMLElement
  direction: PointKey
  scroll?: AnimateSignal
  factory?: ClampingScrollFactory
  nextScroll?: OnScroll
  edgeSlow?: number


  onDragBegin?(): void
  onDragEnd?(): void

  onScroll?: StoreRef<boolean>
  //原始滚动中的属性
  edgeConfig?(velocity: number): AnimateSignalConfig;
  edgeBackConfig?: DeltaXSignalAnimationConfig;
  /**吸附 */
  targetSnap?: (n: number) => number;
  /**获得强制吸附的位置 */
  getForceStop?: (current: number, idealTarget: number) => number;
  onProcess?: SetValue<number>;
  onOutProcess?: SetValue<number>;
}

interface DirectionGet {
  getContentSize(): number
  getContainerSize(): number
  getDetail(e: WheelEvent): number
}
class XDirectionGet implements DirectionGet {
  constructor(
    private container: HTMLElement,
    private content: HTMLElement
  ) { }
  getContainerSize(): number {
    return this.container.clientWidth
  }
  getContentSize(): number {
    return this.content.offsetWidth
  }
  getDetail(e: WheelEvent): number {
    return e.deltaX
  }
}
class YDirectionGet implements DirectionGet {
  constructor(
    private container: HTMLElement,
    private content: HTMLElement
  ) { }
  getContainerSize(): number {
    return this.container.clientHeight
  }
  getContentSize(): number {
    return this.content.offsetHeight
  }
  getDetail(e: WheelEvent): number {
    return e.deltaY
  }
}
export function pluginOnScroll(config: OnScrollI) {
  return function (content: HTMLElement) {
    OnScroll.hookGet(content, config)
  }
}
export class OnScroll {
  private edgeSlow: number
  private readonly scroll: AnimateSignal
  readonly scrollFactory: ClampingScrollFactory
  getScroll: GetValue<number>

  readonly directionGet: DirectionGet
  static hookGet(content: HTMLElement, config: OnScrollI) {
    return new OnScroll(content, config)
  }
  readonly getPage: (a: {
    pageX: number
    pageY: number
  }) => number
  private constructor(
    readonly content: HTMLElement,
    readonly config: OnScrollI
  ) {
    this.scroll = config?.scroll || animateSignal(0)
    this.getScroll = this.scroll.get
    this.scrollFactory = config?.factory || ClampingScrollFactory.get()
    this.edgeSlow = this.config.edgeSlow || 3
    const container = this.config.container
    if (this.config.direction == 'x') {
      this.directionGet = new XDirectionGet(container, content)
      this.getPage = eventGetPageX
    } else {
      this.getPage = eventGetPageY
      this.directionGet = new YDirectionGet(container, content)
    }
    this.wheelScroll()
    this.pointerScroll()

    const that = this
    const containerSize = createSignal(this.directionGet.getContainerSize())
    const contentSize = createSignal(this.directionGet.getContentSize())
    const ob = new ResizeObserver(function () {
      const newContainerSize = that.directionGet.getContainerSize()
      const newContentSize = that.directionGet.getContentSize()
      const newMaxScroll = getMaxScroll(newContainerSize, newContentSize)
      // const sY = that.scroll.getTarget()
      // const oldMaxScroll = getMaxScroll(containerSize.get(), contentSize.get())
      /**
       * scroll怎么变,如果超出新的maxScroll
       * 是按比例,按哪个比例?
       * 
       * 未超出时,按比例/不改变
       * 超出后,截断,按比例
       * 
       */
      if (that.scroll.getTarget() > newMaxScroll) {
        that.scroll.silentChangeTo(newMaxScroll)
      }
      containerSize.set(newContainerSize)
      contentSize.set(newContentSize)
    })
    ob.observe(config.container)
    ob.observe(content)
    hookDestroy(() => {
      ob.disconnect()
    })
  }
  private wheelScroll() {
    let lastTime = performance.now()
    this.config.container.addEventListener('wheel', e => {
      this.config
      const duration = e.timeStamp - lastTime
      const detail = this.directionGet.getDetail(e)
      this.drag(detail)
      this.destination(detail / duration)
      lastTime = e.timeStamp
    })
  }

  private drag(delta: number) {
    const v = this.scroll.get()
    const tempV = v + delta
    const maxScroll = getMaxScroll(
      this.directionGet.getContainerSize(),
      this.directionGet.getContentSize()
    )
    if (tempV < 0 || tempV > maxScroll) {
      if (this.config.nextScroll) {
        if (tempV < 0) {
          this.scroll.set(0)
          this.config.nextScroll.drag(tempV)
        } else {
          this.scroll.set(maxScroll)
          this.config.nextScroll.drag(tempV - maxScroll)
        }
      } else {
        if (tempV < 0) {
          this.scroll.set(tempV / this.edgeSlow)
        } else {
          this.scroll.set(maxScroll + (tempV - maxScroll) / this.edgeSlow)
        }
      }
    } else {
      this.scroll.set(tempV)
    }
    // const
  }
  /**
   * 惯性滚动到边界,带动外部
   * @param velocity 
   * @returns 
   */
  private scrollToEdge = (velocity: number) => {
    if (this.config.nextScroll) {
      this.config.nextScroll.destination(velocity)
      return true
    }
  }
  /**
   * 惯性滚动
   * @param velocity 
   */
  private destination = (velocity: number) => {
    destinationWithMargin({
      ...this.config,
      scroll: this.scroll,
      frictional: this.scrollFactory.getFromVelocity(velocity),
      containerSize: this.directionGet.getContainerSize(),
      contentSize: this.directionGet.getContentSize(),
      scrollToEdge: this.scrollToEdge,
    })
  }
  private pointerScroll() {
    const that = this
    this.config.container.addEventListener("pointerdown", pointerMoveDir(function () {
      that.scroll.stop()
      return {
        onMove(e, dir) {
          if (dir == that.config.direction) {
            that.config.onDragBegin?.()
            pointerMove(ScrollFromPage.from(e, {
              getPage: that.getPage as any,
              scrollDelta(delta, velocity) {
                that.drag(delta)
              },
              onFinish(velocity) {
                that.config.onDragEnd?.()
                that.destination(velocity)
              }
            }))
          }
        }
      }
    }))
  }
}