import { createSignal, EmptyFun, emptyFun, ReadArray, ValueOrGet, valueOrGetToGet } from "wy-helper";





export interface PagePoint {
  pageX: number
  pageY: number
}

export function scrollerSignal(p: {
  clientLeft: ValueOrGet<number>
  clientTop: ValueOrGet<number>
  clientWidth: ValueOrGet<number>
  clientHeight: ValueOrGet<number>
  contentWidth: ValueOrGet<number>
  contentHeight: ValueOrGet<number>

  scrollingX?: ValueOrGet<boolean>
  scrollingY?: ValueOrGet<boolean>
  zooming?: ValueOrGet<boolean>,
  maxZoom?: ValueOrGet<number>,
  minZoom?: ValueOrGet<number>,
  /** 启用弹跳（内容可以缓慢移出并在释放后跳回） */
  bouncing?: ValueOrGet<boolean>
  speedMultiplier?: ValueOrGet<number>
  locking?: ValueOrGet<boolean>
  /** 启用减速、快速返回、缩放和滚动的动画 */
  animating?: ValueOrGet<boolean>,
  paging?: ValueOrGet<boolean>
  snaping?: ValueOrGet<boolean>
  scrollingComplete?(): void
}) {
  const m = {
    /** Enable scrolling on x-axis */
    scrollingX: true,

    /** Enable scrolling on y-axis */
    scrollingY: true,
    /** 启用减速、快速返回、缩放和滚动的动画 */
    animating: true,
    /** scrollTo/zoomTo 触发动画的持续时间 */
    animationDuration: 250,
    /** 启用弹跳（内容可以缓慢移出并在释放后跳回） */
    bouncing: true,
    /** 如果用户在开始时仅在其中一个轴上稍微移动，则启用对主轴的锁定 */
    locking: true,
    /** 启用分页模式（在整页内容窗格之间切换） */
    paging: false,
    /** 启用内容捕捉到配置的像素网格 */
    snapping: false,
    /** 通过 API、手指和鼠标滚轮启用内容缩放 */
    zooming: false,

    /** Minimum zoom level */
    minZoom: 0.5,

    /** Maximum zoom level */
    maxZoom: 3,
    /** 增加或减少滚动速度 **/
    speedMultiplier: 1,
    /** 回调在触摸结束或减速结束时触发，
    前提是另一个滚动操作尚未开始。用于了解
    何时淡出滚动条。*/
    scrollingComplete: emptyFun,
    /** 增加或减少施加于减速的摩擦力量 **/
    decelerationRate: 0.95,
    /** 配置到达边界时减速的变化量 **/
    penetrationDeceleration: 0.03,
    /** 配置到达边界时加速度的变化量 **/
    penetrationAcceleration: 0.08,
    ...p
  } as Required<typeof p>
  const clientLeft = valueOrGetToGet(m.clientLeft)
  const clientTop = valueOrGetToGet(m.clientTop)
  const clientWidth = valueOrGetToGet(m.clientWidth)
  const clientHeight = valueOrGetToGet(m.clientHeight)
  const contentWidth = valueOrGetToGet(m.contentWidth)
  const contentHeight = valueOrGetToGet(m.contentHeight)
  const zooming = valueOrGetToGet(m.zooming)
  const minZoom = valueOrGetToGet(m.minZoom)
  const maxZoom = valueOrGetToGet(m.maxZoom)
  const scrollingX = valueOrGetToGet(m.scrollingX)
  const scrollingY = valueOrGetToGet(m.scrollingY)
  const speedMultiplier = valueOrGetToGet(m.speedMultiplier)
  const bouncing = valueOrGetToGet(m.bouncing)
  const locking = valueOrGetToGet(m.locking)
  const animating = valueOrGetToGet(m.animating)
  const paging = valueOrGetToGet(m.paging)
  const snaping = valueOrGetToGet(m.snaping)


  const zoomLevel = createSignal(0)
  const left = createSignal(0)
  const top = createSignal(0)

  function maxScrollLeft() {
    return Math.max((contentWidth() * zoomLevel.get()) - clientWidth(), 0)
  }
  function maxScrollTop() {
    return Math.max((contentHeight() * zoomLevel.get()) - clientHeight(), 0)
  }

  let refreshActive = false
  let refreshHeight: null | number = null
  let refreshActivate: EmptyFun | null = null
  let refreshDeactivate: EmptyFun | null = null


  function publish(left: number, top: number, zoom: number, animate?: boolean) {
  }

  function doTouchStart(touches: ReadArray<PagePoint>, timeStamp: number) {
    // Array-like check is enough here
    if (touches.length == null) {
      throw new Error("Invalid touch list: " + touches);
    }

    let interruptedAnimation = true



    const n = toPoint(touches)
    let initialTouchLeft = n.currentTouchLeft
    let initialTouchTop = n.currentTouchTop


    let lastTouchLeft = n.currentTouchLeft
    let lastTouchTop = n.currentTouchTop
    const positions: number[] = []

    let isDragging = !n.isSingleTouch

    const isSingleTouch = n.isSingleTouch

    let enableScrollX = !isSingleTouch && scrollingX()
    let enableScrollY = !isSingleTouch && scrollingY()
    let lastScale = 1
    let lastTouchMove = timeStamp
    function doTouchMove(
      touches: ReadArray<PagePoint>,
      timeStamp: number,
      scale?: number
    ) {
      if (touches.length == null) {
        throw new Error("Invalid touch list: " + touches);
      }

      const n = toPoint(touches)

      // 我们已经处于拖动模式了吗？
      if (isDragging) {
        // 计算移动距离
        var moveX = n.currentTouchLeft - lastTouchLeft;
        var moveY = n.currentTouchTop - lastTouchTop;

        let scrollLeft = left.get()
        let scrollTop = top.get()
        var level = zoomLevel.get();

        // Work with scaling
        if (scale != null && zooming()) {
          var oldLevel = level;
          // Recompute level based on previous scale and new scale
          level = level / lastScale * scale;

          // Limit level according to configuration
          level = Math.max(Math.min(level, maxZoom()), minZoom());

          // Only do further compution when change happened
          if (oldLevel !== level) {

            // Compute relative event position to container
            var currentTouchLeftRel = n.currentTouchLeft - clientLeft();
            var currentTouchTopRel = n.currentTouchTop - clientTop();

            // Recompute left and top coordinates based on new zoom level
            scrollLeft = ((currentTouchLeftRel + scrollLeft) * level / oldLevel) - currentTouchLeftRel;
            scrollTop = ((currentTouchTopRel + scrollTop) * level / oldLevel) - currentTouchTopRel;
          }
        }

        if (enableScrollX) {
          scrollLeft -= moveX * speedMultiplier();
          var _maxScrollLeft = maxScrollLeft();
          if (scrollLeft > _maxScrollLeft || scrollLeft < 0) {
            // Slow down on the edges
            if (bouncing()) {
              scrollLeft += (moveX / 2 * speedMultiplier());
            } else if (scrollLeft > _maxScrollLeft) {
              scrollLeft = _maxScrollLeft;
            } else {
              scrollLeft = 0;
            }
          }
        }

        // Compute new vertical scroll position
        if (enableScrollY) {
          scrollTop -= moveY * speedMultiplier();
          var _maxScrollTop = maxScrollTop();
          if (scrollTop > _maxScrollTop || scrollTop < 0) {
            // Slow down on the edges
            if (bouncing()) {
              scrollTop += (moveY / 2 * speedMultiplier());
              // Support pull-to-refresh (only when only y is scrollable)
              if (!enableScrollX && refreshHeight != null) {

                if (!refreshActive && scrollTop <= -refreshHeight) {

                  refreshActive = true;
                  if (refreshActivate) {
                    refreshActivate();
                  }

                } else if (refreshActive && scrollTop > -refreshHeight) {

                  refreshActive = false;
                  if (refreshDeactivate) {
                    refreshDeactivate();
                  }
                }
              }
            } else if (scrollTop > _maxScrollTop) {
              scrollTop = _maxScrollTop;
            } else {
              scrollTop = 0;
            }
          }
        }

        // Keep list from growing infinitely (holding min 10, max 20 measure points)
        if (positions.length > 60) {
          positions.splice(0, 30);
        }

        // Track scroll movement for decleration
        positions.push(scrollLeft, scrollTop, timeStamp);

        // Sync scroll position
        publish(scrollLeft, scrollTop, level);

        // Otherwise figure out whether we are switching into dragging mode now.
      } else {

        var minimumTrackingForScroll = locking() ? 3 : 0;
        var minimumTrackingForDrag = 5;

        var distanceX = Math.abs(n.currentTouchLeft - initialTouchLeft);
        var distanceY = Math.abs(n.currentTouchTop - initialTouchTop);

        enableScrollX = scrollingX() && distanceX >= minimumTrackingForScroll;
        enableScrollY = scrollingY() && distanceY >= minimumTrackingForScroll;

        positions.push(left.get(), top.get(), timeStamp);

        isDragging = (enableScrollX || enableScrollY) && (distanceX >= minimumTrackingForDrag || distanceY >= minimumTrackingForDrag);
        if (isDragging) {
          interruptedAnimation = false;
        }

      }
      // Update last touch positions and time stamp for next event
      lastTouchLeft = n.currentTouchLeft;
      lastTouchTop = n.currentTouchTop;
      lastTouchMove = timeStamp;
      lastScale = scale || 1;
    }

    function doTouchEnd(
      timeStamp: number
    ) {
      if (isDragging) {
        // 开始减速
        // 验证检测到的最后移动是否在某个相关的时间范围内
        if (isSingleTouch && animating() && (timeStamp - lastTouchMove) <= 100) {
          // 然后找出大约 100 毫秒前的滚动位置
          var endPos = positions.length - 1;
          var startPos = endPos;
          // 将指针移动到 100 毫秒前测量的位置
          for (var i = endPos; i > 0 && positions[i] > (lastTouchMove - 100); i -= 3) {
            startPos = i;
          }

          /**
           // 如果我们在 100 毫秒内没有收到连续的 touchmove 事件，
            // 则根据第一个位置尝试尽最大努力。
            // 这种情况通常发生在滚动期间主线程上发生昂贵的操作时，例如图像解码。
            */
          if (startPos === endPos && positions.length > 5) {
            startPos = 2;
          }

          /**
          // 如果在 100 毫秒的时间范围内开始和停止位置相同，
          // 我们无法计算任何有用的减速。
            */
          if (startPos !== endPos) {
            // 计算这两点之间的相对运动
            var timeOffset = positions[endPos] - positions[startPos];
            var movedLeft = left.get() - positions[startPos - 2];
            var movedTop = top.get() - positions[startPos - 1];

            // 基于 50ms 计算每个渲染步骤所需的移动量
            const decelerationVelocityX = movedLeft / timeOffset * (1000 / 60);
            const decelerationVelocityY = movedTop / timeOffset * (1000 / 60);
            // 需要多少速度来开始减速
            var minVelocityToStartDeceleration = paging() || snaping() ? 4 : 1;
            // 验证我们是否有足够的速度来开始减速
            if (Math.abs(decelerationVelocityX) > minVelocityToStartDeceleration || Math.abs(decelerationVelocityY) > minVelocityToStartDeceleration) {
              // 减速时停用下拉刷新
              if (!refreshActive) {
                // self.__startDeceleration(timeStamp);
              }
            }
          } else {
            m.scrollingComplete();
          }
        } else if ((timeStamp - lastTouchMove) > 100) {
          m.scrollingComplete();
        }
      }
    }
  }
}

function toPoint(touches: ReadArray<PagePoint>) {
  // Use center point when dealing with two fingers
  let currentTouchLeft, currentTouchTop;
  let isSingleTouch = touches.length === 1;
  if (isSingleTouch) {
    currentTouchLeft = touches[0].pageX;
    currentTouchTop = touches[0].pageY;
  } else {
    currentTouchLeft = Math.abs(touches[0].pageX + touches[1].pageX) / 2;
    currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2;
  }
  return {
    isSingleTouch,
    currentTouchLeft,
    currentTouchTop
  }
}