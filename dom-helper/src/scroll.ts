import { hookDestroy, hookTrackSignal } from "mve-helper"
import { animateSignal, pointerMove, pointerMoveDir } from "wy-dom-helper"
import { addEffect, AnimateSignal, AnimateSignalConfig, ClampingScrollFactory, createSignal, DeltaXSignalAnimationConfig, destinationWithMargin, eventGetPageX, eventGetPageY, getMaxScroll, GetValue, getValueOrGet, numberBetween, PointKey, scrollForEdge, ScrollFromPage, ScrollHelper, SetValue, storeRef, StoreRef, ValueOrGet, valueOrGetToGet } from "wy-helper"




export interface OnScrollI {
  init?: number

  maxScroll: ValueOrGet<number>
  minScroll?: ValueOrGet<number>
  // direction: PointKey
  factory?: ClampingScrollFactory
  // nextScroll?: OnScroll
  edgeSlow?: number

  opposite?: boolean

  //原始滚动中的属性
  edgeConfig?(velocity: number): AnimateSignalConfig;
  edgeBackConfig?: DeltaXSignalAnimationConfig;
  /**吸附 */
  targetSnap?: (n: number) => number;
  /**获得强制吸附的位置 */
  getForceStop?: (current: number, idealTarget: number) => number;
  onProcess?: SetValue<number>;
  onOutProcess?: SetValue<number>;



  onDragBegin?(): void
  onDragEnd?(): void
}

interface DirectionGet {
  getContentSize(): number
  getContainerSize(): number
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
}
export function measureMaxScroll(
  direction: PointKey
) {
  const maxScroll = createSignal(0)
  let inited = false
  return {
    get: maxScroll.get,
    hookInit(
      container: HTMLElement,
      content: HTMLElement
    ) {
      if (inited) {
        console.log('禁止重复初始化')
        return
      }
      inited = true
      let directionGet: DirectionGet
      if (direction == 'x') {
        directionGet = new XDirectionGet(container, content)
      } else {
        directionGet = new YDirectionGet(container, content)
      }
      addEffect(() => {
        maxScroll.set(getMaxScroll(directionGet.getContainerSize(), directionGet.getContentSize()))
      })
      const ob = new ResizeObserver(function () {
        maxScroll.set(getMaxScroll(directionGet.getContainerSize(), directionGet.getContentSize()))
      })
      ob.observe(container)
      ob.observe(content)
      hookDestroy(() => {
        ob.disconnect()
      })
    }
  }
}

function getWheelDetailX(e: WheelEvent) {
  return e.deltaX
}
function getWheelDetailY(e: WheelEvent) {
  return e.deltaY
}


export class OnScroll {
  private edgeSlow: number
  readonly scrollFactory: ClampingScrollFactory
  readonly get: GetValue<number>
  readonly onAnimation: GetValue<boolean>
  set(n: number) {
    return this.drag(n - this.get())
  }
  animateTo(n: number, config?: DeltaXSignalAnimationConfig) {
    n = numberBetween(this.getMinScroll(), n, this.getMaxScroll())
    return this.scroll.animateTo(this.toSnap(n), config)
  }
  scrollTo(n: number) {
    return this.destinationWithMargin(this.scrollFactory.getFromDistance(n - this.get()))
  }
  readonly getWheelDetail: (e: WheelEvent) => number

  measureMaxScroll() {
    return measureMaxScroll(this.direction)
  }
  static hookGet(
    direction: PointKey,
    container: HTMLElement,
    config: OnScrollI
  ) {
    const scroll = new OnScroll(direction, config)
    container.addEventListener('pointerdown', scroll.pointerEventListner)
    container.addEventListener('wheel', scroll.wheelEventListener)
    return scroll
  }
  minNextScroll?: OnScroll
  maxNextScroll?: OnScroll
  readonly getMinScroll: GetValue<number>
  readonly getMaxScroll: GetValue<number>
  private readonly scroll: AnimateSignal
  readonly getPage: (a: {
    pageX: number
    pageY: number
  }) => number
  constructor(
    private readonly direction: PointKey,
    readonly config: OnScrollI
  ) {
    this.scrollFactory = config?.factory || ClampingScrollFactory.get()
    this.edgeSlow = this.config.edgeSlow || 3
    if (this.direction == 'x') {
      this.getWheelDetail = getWheelDetailX
      this.getPage = eventGetPageX
    } else {
      this.getWheelDetail = getWheelDetailY
      this.getPage = eventGetPageY
    }
    this.getMinScroll = valueOrGetToGet(config.minScroll || 0)
    this.getMaxScroll = valueOrGetToGet(config.maxScroll)
    if (typeof config.minScroll == 'function') {
      hookTrackSignal(this.getMinScroll, v => {
        addEffect(() => {
          if (this.scroll.getTarget() < v) {
            this.scroll.silentChangeTo(v)
          }
        })
      })
    }
    if (typeof config.maxScroll == 'function') {
      hookTrackSignal(this.getMaxScroll, v => {
        addEffect(() => {
          if (this.scroll.getTarget() > v) {
            this.scroll.silentChangeTo(v)
          }
        })
      })
    }
    let init = this.config.init
    if (typeof init == 'number') {
      init = numberBetween(this.getMinScroll(), init, this.getMaxScroll())
    } else {
      init = this.getMinScroll()
    }
    this.scroll = animateSignal(init)
    this.get = this.scroll.get
    this.onAnimation = this.scroll.onAnimation
    const that = this

    let lastTime = performance.now()
    const a = this.config.opposite ? -1 : 1
    this.wheelEventListener = function (e: WheelEvent) {
      const duration = e.timeStamp - lastTime
      const detail = that.getWheelDetail(e) * a
      that.drag(detail)
      that.destination(detail / duration)
      lastTime = e.timeStamp
    }
    /**
     * 代理问题挺多
     */
    this.pointerEventListner = pointerMoveDir(function () {
      that.scroll.stop()
      return {
        onMove(e, dir) {
          if (dir == that.direction) {
            that.config.onDragBegin?.()
            pointerMove(ScrollFromPage.from(e, {
              getPage: that.getPage as any,
              scrollDelta(delta, velocity) {
                that.drag(delta)
              },
              opposite: that.config.opposite,
              onFinish(velocity) {
                that.config.onDragEnd?.()
                that.destination(velocity)
              }
            }))
          } else {
            //如果有吸附,需要吸附
            that.scrollToIdeal()
          }
        },
        onCancel(e) {
          //如果有吸附,需要吸附
          that.scrollToIdeal()
        },
      }
    })
  }
  private scrollToIdeal() {
    const targetSnap = this.config.targetSnap
    if (targetSnap) {
      const v = this.get()
      const destination = targetSnap(v)
      if (v != destination) {
        this.animateTo(destination)
      }
    }
  }
  private toSnap(n: number) {
    const targetSnap = this.config.targetSnap
    if (targetSnap) {
      return targetSnap(n)
    }
    return n
  }
  private drag(delta: number) {
    const v = this.scroll.get()
    const tempV = v + delta
    const minScroll = this.getMinScroll()
    const maxScroll = this.getMaxScroll()
    if (tempV < minScroll || tempV > maxScroll) {
      if (tempV < minScroll && this.minNextScroll) {
        this.scroll.set(minScroll)
        this.minNextScroll.drag(tempV)
        return
      }
      if (tempV > maxScroll && this.maxNextScroll) {
        this.scroll.set(maxScroll)
        this.maxNextScroll.drag(tempV - maxScroll)
        return
      }
      if (tempV < minScroll) {
        this.scroll.set(v + delta / this.edgeSlow)
      } else {
        this.scroll.set(v + delta / this.edgeSlow)
      }
    } else {
      this.scroll.set(tempV)
    }
  }
  /**
   * 惯性滚动到边界,带动外部
   * @param velocity 
   * @returns 
   */
  private scrollToEdge = (velocity: number, edge: number) => {
    if (edge == this.getMinScroll() && this.minNextScroll) {
      this.minNextScroll.destination(velocity)
      return true
    }
    if (edge == this.getMaxScroll() && this.maxNextScroll) {
      this.maxNextScroll.destination(velocity)
      return true
    }
  }
  private destinationWithMargin(frictional: ScrollHelper): Promise<boolean | "immediately"> {
    const c = this.get()
    if (this.getMaxScroll() == c && this.maxNextScroll && frictional.distance > 0) {
      return this.maxNextScroll.destinationWithMargin(frictional)
    }
    if (this.getMinScroll() == c && this.minNextScroll && frictional.distance < 0) {
      return this.minNextScroll.destinationWithMargin(frictional)
    }
    return destinationWithMargin({
      ...this.config,
      maxScroll: this.getMaxScroll(),
      minScroll: this.getMinScroll(),
      scroll: this.scroll,
      frictional,
      scrollToEdge: this.scrollToEdge,
    })
  }
  /**
   * 惯性滚动
   * @param velocity 
   */
  private destination = (velocity: number) => {
    return this.destinationWithMargin(this.scrollFactory.getFromVelocity(velocity))
  }
  /**
   * 应该可以允许多个容器,只要不重复
   * @param container 
   * @param config 
   * @returns 
   */
  readonly pointerEventListner: SetValue<PointerEvent>
  readonly wheelEventListener: SetValue<WheelEvent>
}