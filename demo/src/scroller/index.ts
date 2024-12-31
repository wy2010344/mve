/*
* Scroller
* http://github.com/zynga/scroller
*
* Copyright 2011, Zynga Inc.
* Licensed under the MIT License.
* https://raw.github.com/zynga/scroller/master/MIT-LICENSE.txt
*
* Based on the work of: Unify Project (unify-project.org)
* http://unify-project.org
* Copyright 2011, Deutsche Telekom AG
* License: MIT + Apache (V2)
*/

import { emptyFun, EmptyFun } from "wy-helper";
import * as Animate from './Animate'
const defaultOptions = {

  /** Enable scrolling on x-axis */
  scrollingX: true,

  /** Enable scrolling on y-axis */
  scrollingY: true,

  /** Enable animations for deceleration, snap back, zooming and scrolling */
  animating: true,

  /** duration for animations triggered by scrollTo/zoomTo */
  animationDuration: 250,

  /** Enable bouncing (content can be slowly moved outside and jumps back after releasing) */
  bouncing: true,

  /** Enable locking to the main axis if user moves only slightly on one of them at start */
  locking: true,

  /** Enable pagination mode (switching between full page content panes) */
  paging: false,

  /** Enable snapping of content to a configured pixel grid */
  snapping: false,

  /** Enable zooming of content via API, fingers and mouse wheel */
  zooming: false,

  /** Minimum zoom level */
  minZoom: 0.5,

  /** Maximum zoom level */
  maxZoom: 3,

  /** Multiply or decrease scrolling speed **/
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
  penetrationAcceleration: 0.08

}

export type Option = typeof defaultOptions
export class Scroller {
  public readonly options: Option
  private __zoomComplete: EmptyFun | null = null;
  private __interruptedAnimation: boolean;
  private __initialTouchLeft: number;
  private __initialTouchTop: number;
  private __zoomLevelStart: number;
  private __lastScale: number;
  private __enableScrollX: boolean;
  private __enableScrollY: boolean;
  private __callback: any;
  constructor(
    public readonly callback: any,
    options: Option
  ) {
    this.options = Object.assign(options, defaultOptions)
  }



  /*
  ---------------------------------------------------------------------------
    INTERNAL FIELDS  = = STATUS
  ---------------------------------------------------------------------------
  */

  /** {Boolean} Whether only a single finger is used in touch handling */
  __isSingleTouch = false

  /** {Boolean} Whether a touch event sequence is in progress */
  __isTracking = false

  /** {Boolean} Whether a deceleration animation went to completion. */
  __didDecelerationComplete = false

  /**
   * {Boolean} Whether a gesture zoom/rotate event is in progress. Activates when
   * a gesturestart event happens. This has higher priority than dragging.
   */
  __isGesturing = false

  /**
   * {Boolean} Whether the user has moved by such a distance that we have enabled
   * dragging mode. Hint = It's only enabled after some pixels of movement to
   * not interrupt with clicks etc.
   */
  __isDragging = false

  /**
   * {Boolean} Not touching and dragging anymore  and smoothly animating the
   * touch sequence using deceleration.
   */
  __isDecelerating: false | number = false

  /**
   * {Boolean} Smoothly animating the currently configured change
   */
  __isAnimating: false | number = false



  /*
  ---------------------------------------------------------------------------
    INTERNAL FIELDS  = = DIMENSIONS
  ---------------------------------------------------------------------------
  */

  /** {Integer} Available outer left position (from document perspective) */
  __clientLeft = 0

  /** {Integer} Available outer top position (from document perspective) */
  __clientTop = 0

  /** {Integer} Available outer width */
  __clientWidth = 0

  /** {Integer} Available outer height */
  __clientHeight = 0

  /** {Integer} Outer width of content */
  __contentWidth = 0

  /** {Integer} Outer height of content */
  __contentHeight = 0

  /** {Integer} Snapping width for content */
  __snapWidth = 100

  /** {Integer} Snapping height for content */
  __snapHeight = 100

  /** {Integer} Height to assign to refresh area */
  __refreshHeight: number | null = null

  /** {Boolean} Whether the refresh process is enabled when the event is released now */
  __refreshActive = false

  /** {Function} Callback to execute on activation. This is for signalling the user about a refresh is about to happen when he release */
  __refreshActivate: (EmptyFun) | null = null

  /** {Function} Callback to execute on deactivation. This is for signalling the user about the refresh being cancelled */
  __refreshDeactivate: (EmptyFun) | null = null

  /** {Function} Callback to execute to start the actual refresh. Call {@link #refreshFinish} when done */
  __refreshStart: (EmptyFun) | null = null

  /** {Number} Zoom level */
  __zoomLevel = 1

  /** {Number} Scroll position on x-axis */
  __scrollLeft = 0

  /** {Number} Scroll position on y-axis */
  __scrollTop = 0

  /** {Integer} Maximum allowed scroll position on x-axis */
  __maxScrollLeft = 0

  /** {Integer} Maximum allowed scroll position on y-axis */
  __maxScrollTop = 0

  /* {Number} Scheduled left position (final position when animating) */
  __scheduledLeft = 0

  /* {Number} Scheduled top position (final position when animating) */
  __scheduledTop = 0

  /* {Number} Scheduled zoom level (final scale when animating) */
  __scheduledZoom = 0



  /*
  ---------------------------------------------------------------------------
    INTERNAL FIELDS  = = LAST POSITIONS
  ---------------------------------------------------------------------------
  */

  /** {Number} Left position of finger at start */
  __lastTouchLeft = 0

  /** {Number} Top position of finger at start */
  __lastTouchTop = 0

  /** {Date} Timestamp of last move of finger. Used to limit tracking range for deceleration speed. */
  __lastTouchMove = 0

  /** {Array} List of positions  uses three indexes for each state = left  top  timestamp */
  __positions: number[] = []



  /*
  ---------------------------------------------------------------------------
    INTERNAL FIELDS  = = DECELERATION SUPPORT
  ---------------------------------------------------------------------------
  */

  /** {Integer} Minimum left scroll position during deceleration */
  __minDecelerationScrollLeft: number = 0

  /** {Integer} Minimum top scroll position during deceleration */
  __minDecelerationScrollTop: number = 0

  /** {Integer} Maximum left scroll position during deceleration */
  __maxDecelerationScrollLeft = 0

  /** {Integer} Maximum top scroll position during deceleration */
  __maxDecelerationScrollTop = 0

  /** {Number} Current factor to modify horizontal scroll position with on every step */
  __decelerationVelocityX = 0

  /** {Number} Current factor to modify vertical scroll position with on every step */
  __decelerationVelocityY = 0

  /**
   * Configures the dimensions of the client (outer) and content (inner) elements.
   * Requires the available space for the outer element and the outer size of the inner element.
   * All values which are falsy (null or zero etc.) are ignored and the old value is kept.
   *
   */
  setDimensions(clientWidth: number, clientHeight: number, contentWidth: number, contentHeight: number) {

    var self = this;

    // Only update values which are defined
    if (clientWidth === +clientWidth) {
      self.__clientWidth = clientWidth;
    }

    if (clientHeight === +clientHeight) {
      self.__clientHeight = clientHeight;
    }

    if (contentWidth === +contentWidth) {
      self.__contentWidth = contentWidth;
    }

    if (contentHeight === +contentHeight) {
      self.__contentHeight = contentHeight;
    }

    // Refresh maximums
    self.__computeScrollMax();

    // Refresh scroll position
    self.scrollTo(self.__scrollLeft, self.__scrollTop, true);

  }


  /**
   * Sets the client coordinates in relation to the document.
   *
   * @param left {Integer ? 0} Left position of outer element
   * @param top {Integer ? 0} Top position of outer element
   */
  setPosition(left: number, top: number) {

    var self = this;

    self.__clientLeft = left || 0;
    self.__clientTop = top || 0;

  }


  /**
   * 配置捕捉（当捕捉处于活动状态时）
   */
  setSnapSize(width: number, height: number) {
    var self = this;
    self.__snapWidth = width;
    self.__snapHeight = height;
  }


  /**
   * * 激活下拉刷新。列表顶部有一个特殊区域，每当
   * * 在此区域可见期间发布用户事件时，都会启动列表刷新。iOS 上的一些应用程序引入了此功能，例如
   * * 官方 Twitter 客户端。
   * *
   * @param height {Integer} 渲染列表顶部下拉刷新区域的高度
* @param activateCallback {Function} 激活时执行的回调。这是为了向用户发出信号，告知用户在他释放时即将发生刷新。
* @param deactivateCallback {Function} 停用时执行的回调。这是为了向用户发出信号，告知刷新已取消。
* @param startCallback {Function} 执行回调以启动真正的异步刷新操作。刷新完成后调用 {@link #finishPullToRefresh}。
    */
  activatePullToRefresh(height: number, activateCallback: EmptyFun, deactivateCallback: EmptyFun, startCallback: EmptyFun) {
    var self = this;
    self.__refreshHeight = height;
    self.__refreshActivate = activateCallback;
    self.__refreshDeactivate = deactivateCallback;
    self.__refreshStart = startCallback;
  }


  /**
   * 手动开始下拉刷新。
   */
  triggerPullToRefresh() {
    // 使用 publish 而不是 scrollTo 来允许滚动到边界位置之外
    // 我们不需要在这里规范化 scrollLeft、zoomLevel 等，因为我们只在启用下拉刷新时进行 y 滚动
    if (this.__refreshHeight !== null) {
      this.__publish(this.__scrollLeft, -this.__refreshHeight, this.__zoomLevel, true);
    }

    if (this.__refreshStart) {
      this.__refreshStart();
    }
  }


  /**
   * 表示下拉刷新已完成。
   */
  finishPullToRefresh() {

    var self = this;

    self.__refreshActive = false;
    if (self.__refreshDeactivate) {
      self.__refreshDeactivate();
    }

    self.scrollTo(self.__scrollLeft, self.__scrollTop, true);

  }


  /**
   * 返回滚动位置和缩放值
   * @return {Map} `left` and `top` scroll position and `zoom` level
   */
  getValues() {

    var self = this;

    return {
      left: self.__scrollLeft,
      top: self.__scrollTop,
      zoom: self.__zoomLevel
    };

  }


  /**
   * 返回最大滚动值
   * @return {Map} `left` and `top` maximum scroll values
   */
  getScrollMax() {

    var self = this;

    return {
      left: self.__maxScrollLeft,
      top: self.__maxScrollTop
    };

  }


  /**
   * Zooms to the given level. Supports optional animation. Zooms
   * the center when no coordinates are given.
   *
   * @param level {Number} Level to zoom to
   * @param animate {Boolean ? false} Whether to use animation
   * @param originLeft {Number ? null} Zoom in at given left coordinate
   * @param originTop {Number ? null} Zoom in at given top coordinate
   * @param callback {Function ? null} A callback that gets fired when the zoom is complete.
   */
  zoomTo(level: number, animate?: boolean, originLeft?: number, originTop?: number, callback?: EmptyFun) {
    var self = this;
    if (!self.options.zooming) {
      throw new Error("Zooming is not enabled!");
    }
    // Add callback if exists
    if (callback) {
      self.__zoomComplete = callback;
    }
    // Stop deceleration
    if (self.__isDecelerating) {
      Animate.stop(self.__isDecelerating);
      self.__isDecelerating = false;
    }
    var oldLevel = self.__zoomLevel;
    // Normalize input origin to center of viewport if not defined
    if (originLeft == null) {
      originLeft = self.__clientWidth / 2;
    }
    if (originTop == null) {
      originTop = self.__clientHeight / 2;
    }
    // Limit level according to configuration
    level = Math.max(Math.min(level, self.options.maxZoom), self.options.minZoom);
    // Recompute maximum values while temporary tweaking maximum scroll ranges
    self.__computeScrollMax(level);
    // Recompute left and top coordinates based on new zoom level
    var left = ((originLeft + self.__scrollLeft) * level / oldLevel) - originLeft;
    var top = ((originTop + self.__scrollTop) * level / oldLevel) - originTop;
    // Limit x-axis
    if (left > self.__maxScrollLeft) {
      left = self.__maxScrollLeft;
    } else if (left < 0) {
      left = 0;
    }
    // Limit y-axis
    if (top > self.__maxScrollTop) {
      top = self.__maxScrollTop;
    } else if (top < 0) {
      top = 0;
    }
    // Push values out
    self.__publish(left, top, level, animate);
  }


  /*** 
   * 按给定的倍数缩放内容。
*
* @param factor {Number} 按给定的倍数缩放
* @param animate {Boolean ? false} 是否使用动画
* @param originLeft {Number ? 0} 在给定的左侧坐标处放大
* @param originTop {Number ? 0} 在给定的顶部坐标处放大
* @param callback {Function ? null} 缩放完成时触发的回调。
   */
  zoomBy(factor: number, animate?: boolean, originLeft = 0, originTop = 0, callback?: EmptyFun) {
    var self = this;
    self.zoomTo(self.__zoomLevel * factor, animate, originLeft, originTop, callback);
  }


  /*** 滚动到指定位置。遵守限制并自动捕捉。
*
* @param left {Number?null} 水平滚动位置，如果值为 <code>null</code>，则保持当前位置
* @param top {Number?null} 垂直滚动位置，如果值为 <code>null</code>，则保持当前位置
* @param animate {Boolean?false} 是否应使用动画进行滚动
* @param zoom {Number?null} 要达到的缩放级别
   */
  scrollTo(left: number, top: number, animate?: boolean, zoom?: number) {

    var self = this;
    // 停止减速
    if (self.__isDecelerating) {
      Animate.stop(self.__isDecelerating);
      self.__isDecelerating = false;
    }
    // 根据新的缩放级别更正坐标
    if (zoom != null && zoom !== self.__zoomLevel) {

      if (!self.options.zooming) {
        throw new Error("Zooming is not enabled!");
      }

      left *= zoom;
      top *= zoom;

      // Recompute maximum values while temporary tweaking maximum scroll ranges
      self.__computeScrollMax(zoom);

    } else {

      // Keep zoom when not defined
      zoom = self.__zoomLevel;

    }

    if (!self.options.scrollingX) {

      left = self.__scrollLeft;

    } else {

      if (self.options.paging) {
        left = Math.round(left / self.__clientWidth) * self.__clientWidth;
      } else if (self.options.snapping) {
        left = Math.round(left / self.__snapWidth) * self.__snapWidth;
      }

    }

    if (!self.options.scrollingY) {

      top = self.__scrollTop;

    } else {

      if (self.options.paging) {
        top = Math.round(top / self.__clientHeight) * self.__clientHeight;
      } else if (self.options.snapping) {
        top = Math.round(top / self.__snapHeight) * self.__snapHeight;
      }

    }

    // Limit for allowed ranges
    left = Math.max(Math.min(self.__maxScrollLeft, left), 0);
    top = Math.max(Math.min(self.__maxScrollTop, top), 0);

    // Don't animate when no change detected, still call publish to make sure
    // that rendered position is really in-sync with internal data
    if (left === self.__scrollLeft && top === self.__scrollTop) {
      animate = false;
    }

    // Publish new values
    self.__publish(left, top, zoom, animate);

  }


  /**
   * 按给定的偏移量滚动
   * Scroll by the given offset
   */
  scrollBy(left: number, top: number, animate?: boolean) {
    var self = this;
    var startLeft = self.__isAnimating ? self.__scheduledLeft : self.__scrollLeft;
    var startTop = self.__isAnimating ? self.__scheduledTop : self.__scrollTop;
    self.scrollTo(startLeft + (left || 0), startTop + (top || 0), animate);
  }



  /*
  ---------------------------------------------------------------------------
    EVENT CALLBACKS
  ---------------------------------------------------------------------------
  */

  /*** 
   * 鼠标滚轮处理程序用于缩放支持
   */
  doMouseZoom(wheelDelta: number, pageX: number, pageY: number) {

    var self = this;
    var change = wheelDelta > 0 ? 0.97 : 1.03;

    return self.zoomTo(self.__zoomLevel * change, false, pageX - self.__clientLeft, pageY - self.__clientTop);

  }


  /**
   * Touch start handler for scrolling support
   */
  doTouchStart(touches: TouchList, timeStamp: number | Date) {
    // Array-like check is enough here
    if (touches.length == null) {
      throw new Error("Invalid touch list: " + touches);
    }

    if (timeStamp instanceof Date) {
      timeStamp = timeStamp.valueOf();
    }
    if (typeof timeStamp !== "number") {
      throw new Error("Invalid timestamp value: " + timeStamp);
    }

    var self = this;

    // Reset interruptedAnimation flag
    self.__interruptedAnimation = true;

    // Stop deceleration
    if (self.__isDecelerating) {
      Animate.stop(self.__isDecelerating);
      self.__isDecelerating = false;
      self.__interruptedAnimation = true;
    }

    // Stop animation
    if (self.__isAnimating) {
      Animate.stop(self.__isAnimating);
      self.__isAnimating = false;
      self.__interruptedAnimation = true;
    }

    // Use center point when dealing with two fingers
    var currentTouchLeft, currentTouchTop;
    var isSingleTouch = touches.length === 1;
    if (isSingleTouch) {
      currentTouchLeft = touches[0].pageX;
      currentTouchTop = touches[0].pageY;
    } else {
      currentTouchLeft = Math.abs(touches[0].pageX + touches[1].pageX) / 2;
      currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2;
    }

    // Store initial positions
    self.__initialTouchLeft = currentTouchLeft;
    self.__initialTouchTop = currentTouchTop;

    // Store current zoom level
    self.__zoomLevelStart = self.__zoomLevel;

    // Store initial touch positions
    self.__lastTouchLeft = currentTouchLeft;
    self.__lastTouchTop = currentTouchTop;

    // Store initial move time stamp
    self.__lastTouchMove = timeStamp;

    // Reset initial scale
    self.__lastScale = 1;

    // Reset locking flags
    self.__enableScrollX = !isSingleTouch && self.options.scrollingX;
    self.__enableScrollY = !isSingleTouch && self.options.scrollingY;

    // Reset tracking flag
    self.__isTracking = true;

    // Reset deceleration complete flag
    self.__didDecelerationComplete = false;

    // Dragging starts directly with two fingers, otherwise lazy with an offset
    self.__isDragging = !isSingleTouch;

    // Some features are disabled in multi touch scenarios
    self.__isSingleTouch = isSingleTouch;

    // Clearing data structure
    self.__positions = [];

  }


  /**
   * Touch move handler for scrolling support
   */
  doTouchMove(touches, timeStamp, scale) {

    // Array-like check is enough here
    if (touches.length == null) {
      throw new Error("Invalid touch list: " + touches);
    }

    if (timeStamp instanceof Date) {
      timeStamp = timeStamp.valueOf();
    }
    if (typeof timeStamp !== "number") {
      throw new Error("Invalid timestamp value: " + timeStamp);
    }

    var self = this;

    // Ignore event when tracking is not enabled (event might be outside of element)
    if (!self.__isTracking) {
      return;
    }


    var currentTouchLeft, currentTouchTop;

    // Compute move based around of center of fingers
    if (touches.length === 2) {
      currentTouchLeft = Math.abs(touches[0].pageX + touches[1].pageX) / 2;
      currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2;
    } else {
      currentTouchLeft = touches[0].pageX;
      currentTouchTop = touches[0].pageY;
    }

    var positions = self.__positions;

    // Are we already is dragging mode?
    if (self.__isDragging) {

      // Compute move distance
      var moveX = currentTouchLeft - self.__lastTouchLeft;
      var moveY = currentTouchTop - self.__lastTouchTop;

      // Read previous scroll position and zooming
      var scrollLeft = self.__scrollLeft;
      var scrollTop = self.__scrollTop;
      var level = self.__zoomLevel;

      // Work with scaling
      if (scale != null && self.options.zooming) {

        var oldLevel = level;

        // Recompute level based on previous scale and new scale
        level = level / self.__lastScale * scale;

        // Limit level according to configuration
        level = Math.max(Math.min(level, self.options.maxZoom), self.options.minZoom);

        // Only do further compution when change happened
        if (oldLevel !== level) {

          // Compute relative event position to container
          var currentTouchLeftRel = currentTouchLeft - self.__clientLeft;
          var currentTouchTopRel = currentTouchTop - self.__clientTop;

          // Recompute left and top coordinates based on new zoom level
          scrollLeft = ((currentTouchLeftRel + scrollLeft) * level / oldLevel) - currentTouchLeftRel;
          scrollTop = ((currentTouchTopRel + scrollTop) * level / oldLevel) - currentTouchTopRel;

          // Recompute max scroll values
          self.__computeScrollMax(level);

        }
      }

      if (self.__enableScrollX) {

        scrollLeft -= moveX * this.options.speedMultiplier;
        var maxScrollLeft = self.__maxScrollLeft;

        if (scrollLeft > maxScrollLeft || scrollLeft < 0) {

          // Slow down on the edges
          if (self.options.bouncing) {

            scrollLeft += (moveX / 2 * this.options.speedMultiplier);

          } else if (scrollLeft > maxScrollLeft) {

            scrollLeft = maxScrollLeft;

          } else {

            scrollLeft = 0;

          }
        }
      }

      // Compute new vertical scroll position
      if (self.__enableScrollY) {

        scrollTop -= moveY * this.options.speedMultiplier;
        var maxScrollTop = self.__maxScrollTop;

        if (scrollTop > maxScrollTop || scrollTop < 0) {

          // Slow down on the edges
          if (self.options.bouncing) {

            scrollTop += (moveY / 2 * this.options.speedMultiplier);

            // Support pull-to-refresh (only when only y is scrollable)
            if (!self.__enableScrollX && self.__refreshHeight != null) {

              if (!self.__refreshActive && scrollTop <= -self.__refreshHeight) {

                self.__refreshActive = true;
                if (self.__refreshActivate) {
                  self.__refreshActivate();
                }

              } else if (self.__refreshActive && scrollTop > -self.__refreshHeight) {

                self.__refreshActive = false;
                if (self.__refreshDeactivate) {
                  self.__refreshDeactivate();
                }

              }
            }

          } else if (scrollTop > maxScrollTop) {

            scrollTop = maxScrollTop;

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
      self.__publish(scrollLeft, scrollTop, level);

      // Otherwise figure out whether we are switching into dragging mode now.
    } else {

      var minimumTrackingForScroll = self.options.locking ? 3 : 0;
      var minimumTrackingForDrag = 5;

      var distanceX = Math.abs(currentTouchLeft - self.__initialTouchLeft);
      var distanceY = Math.abs(currentTouchTop - self.__initialTouchTop);

      self.__enableScrollX = self.options.scrollingX && distanceX >= minimumTrackingForScroll;
      self.__enableScrollY = self.options.scrollingY && distanceY >= minimumTrackingForScroll;

      positions.push(self.__scrollLeft, self.__scrollTop, timeStamp);

      self.__isDragging = (self.__enableScrollX || self.__enableScrollY) && (distanceX >= minimumTrackingForDrag || distanceY >= minimumTrackingForDrag);
      if (self.__isDragging) {
        self.__interruptedAnimation = false;
      }

    }

    // Update last touch positions and time stamp for next event
    self.__lastTouchLeft = currentTouchLeft;
    self.__lastTouchTop = currentTouchTop;
    self.__lastTouchMove = timeStamp;
    self.__lastScale = scale;

  }


  /**
   * Touch end handler for scrolling support
   */
  doTouchEnd(timeStamp: number | Date) {

    if (timeStamp instanceof Date) {
      timeStamp = timeStamp.valueOf();
    }
    if (typeof timeStamp !== "number") {
      throw new Error("Invalid timestamp value: " + timeStamp);
    }

    var self = this;
    // 当未启用跟踪时忽略事件（元素上没有 touchstart 事件）
    // 这是必需的，因为此监听器（“touchmove”）位于文档上，而不是元素本身上。
    if (!self.__isTracking) {
      return;
    }
    // 不再触摸（当两根手指击中屏幕时有两个触摸结束事件）
    self.__isTracking = false;
    // 请务必立即重置拖动标志。这里我们还检测手指移动的速度是否足够快，以切换到减速动画。
    if (self.__isDragging) {
      // 重置拖动标志
      self.__isDragging = false;
      // 开始减速
      // 验证检测到的最后移动是否在某个相关的时间范围内
      if (self.__isSingleTouch && self.options.animating && (timeStamp - self.__lastTouchMove) <= 100) {
        // 然后找出大约 100 毫秒前的滚动位置
        var positions = self.__positions;
        var endPos = positions.length - 1;
        var startPos = endPos;
        // 将指针移动到 100 毫秒前测量的位置
        for (var i = endPos; i > 0 && positions[i] > (self.__lastTouchMove - 100); i -= 3) {
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
          var movedLeft = self.__scrollLeft - positions[startPos - 2];
          var movedTop = self.__scrollTop - positions[startPos - 1];

          // 基于 50ms 计算每个渲染步骤所需的移动量
          self.__decelerationVelocityX = movedLeft / timeOffset * (1000 / 60);
          self.__decelerationVelocityY = movedTop / timeOffset * (1000 / 60);

          // How much velocity is required to start the deceleration
          var minVelocityToStartDeceleration = self.options.paging || self.options.snapping ? 4 : 1;

          // Verify that we have enough velocity to start deceleration
          if (Math.abs(self.__decelerationVelocityX) > minVelocityToStartDeceleration || Math.abs(self.__decelerationVelocityY) > minVelocityToStartDeceleration) {

            // Deactivate pull-to-refresh when decelerating
            if (!self.__refreshActive) {
              self.__startDeceleration(timeStamp);
            }
          }
        } else {
          self.options.scrollingComplete();
        }
      } else if ((timeStamp - self.__lastTouchMove) > 100) {
        self.options.scrollingComplete();
      }
    }

    // 如果这是一个较慢的移动，则默认情况下不会减速，但这
    // 仍然意味着我们希望快速回到边界，这是在这里完成的。
    // 这被放置在上述条件之外，以提高边缘情况的稳定性
    // 例如，在未启用拖动的情况下触发 touchend。这通常不应该
    // 修改滚动位置，甚至显示滚动条。
    if (!self.__isDecelerating) {

      if (self.__refreshActive && self.__refreshStart) {

        // Use publish instead of scrollTo to allow scrolling to out of boundary position
        // We don't need to normalize scrollLeft, zoomLevel, etc. here because we only y-scrolling when pull-to-refresh is enabled
        if (self.__refreshHeight !== null) {
          self.__publish(self.__scrollLeft, -self.__refreshHeight, self.__zoomLevel, true);
        }

        if (self.__refreshStart) {
          self.__refreshStart();
        }

      } else {

        if (self.__interruptedAnimation || self.__isDragging) {
          self.options.scrollingComplete();
        }
        self.scrollTo(self.__scrollLeft, self.__scrollTop, true, self.__zoomLevel);

        // Directly signalize deactivation (nothing todo on refresh?)
        if (self.__refreshActive) {

          self.__refreshActive = false;
          if (self.__refreshDeactivate) {
            self.__refreshDeactivate();
          }

        }
      }
    }

    // Fully cleanup list
    self.__positions.length = 0;

  }



  /*
  ---------------------------------------------------------------------------
    PRIVATE API
  ---------------------------------------------------------------------------
  */

  /**
   * Applies the scroll position to the content element
   *
   * @param left {Number} Left scroll position
   * @param top {Number} Top scroll position
   * @param animate {Boolean?false} Whether animation should be used to move to the new coordinates
   */
  __publish(left: number, top: number, zoom: number, animate?: boolean) {

    var self = this;

    // Remember whether we had an animation, then we try to continue based on the current "drive" of the animation
    var wasAnimating = self.__isAnimating;
    if (wasAnimating) {
      Animate.stop(wasAnimating);
      self.__isAnimating = false;
    }

    if (animate && self.options.animating) {

      // Keep scheduled positions for scrollBy/zoomBy functionality
      self.__scheduledLeft = left;
      self.__scheduledTop = top;
      self.__scheduledZoom = zoom;

      var oldLeft = self.__scrollLeft;
      var oldTop = self.__scrollTop;
      var oldZoom = self.__zoomLevel;

      var diffLeft = left - oldLeft;
      var diffTop = top - oldTop;
      var diffZoom = zoom - oldZoom;

      // 当基于上一个动画继续时，我们选择缓出动画而不是缓入缓出动画
      self.__isAnimating = Animate.start(
        function (percent: number, now: any, render: any) {
          if (render) {
            self.__scrollLeft = oldLeft + (diffLeft * percent);
            self.__scrollTop = oldTop + (diffTop * percent);
            self.__zoomLevel = oldZoom + (diffZoom * percent);
            // Push values out
            if (self.__callback) {
              self.__callback(self.__scrollLeft, self.__scrollTop, self.__zoomLevel);
            }
          }
        },
        function (id: number) {
          return self.__isAnimating === id;
        },
        function (renderedFramesPerSecond, animationId, wasFinished) {
          if (animationId === self.__isAnimating) {
            self.__isAnimating = false;
          }
          if (self.__didDecelerationComplete || wasFinished) {
            self.options.scrollingComplete();
          }

          if (self.options.zooming) {
            self.__computeScrollMax();
            if (self.__zoomComplete) {
              self.__zoomComplete();
              self.__zoomComplete = null;
            }
          }
        },
        self.options.animationDuration, wasAnimating ? easeOutCubic : easeInOutCubic);

    } else {

      self.__scheduledLeft = self.__scrollLeft = left;
      self.__scheduledTop = self.__scrollTop = top;
      self.__scheduledZoom = self.__zoomLevel = zoom;

      // Push values out
      if (self.__callback) {
        self.__callback(left, top, zoom);
      }

      // Fix max scroll ranges
      if (self.options.zooming) {
        self.__computeScrollMax();
        if (self.__zoomComplete) {
          self.__zoomComplete();
          self.__zoomComplete = null;
        }
      }
    }
  }


  /**
   * 根据客户端尺寸和内容尺寸重新计算滚动最小值。
   */
  __computeScrollMax(zoomLevel?: number) {

    var self = this;

    if (zoomLevel == null) {
      zoomLevel = self.__zoomLevel;
    }

    self.__maxScrollLeft = Math.max((self.__contentWidth * zoomLevel) - self.__clientWidth, 0);
    self.__maxScrollTop = Math.max((self.__contentHeight * zoomLevel) - self.__clientHeight, 0);

  }



  /*
  ---------------------------------------------------------------------------
    ANIMATION (DECELERATION) SUPPORT
  ---------------------------------------------------------------------------
  */

  /*** 当触摸序列结束且手指速度足够高时调用
* 切换到减速模式。
   */
  __startDeceleration(timeStamp: number) {
    var self = this;
    if (self.options.paging) {
      var scrollLeft = Math.max(Math.min(self.__scrollLeft, self.__maxScrollLeft), 0);
      var scrollTop = Math.max(Math.min(self.__scrollTop, self.__maxScrollTop), 0);
      var clientWidth = self.__clientWidth;
      var clientHeight = self.__clientHeight;
      // 我们将减速限制在允许范围的最小/最大值，而不是可见客户区的大小。
      // 每个页面应具有与客户区完全相同的大小。
      self.__minDecelerationScrollLeft = Math.floor(scrollLeft / clientWidth) * clientWidth;
      self.__minDecelerationScrollTop = Math.floor(scrollTop / clientHeight) * clientHeight;
      self.__maxDecelerationScrollLeft = Math.ceil(scrollLeft / clientWidth) * clientWidth;
      self.__maxDecelerationScrollTop = Math.ceil(scrollTop / clientHeight) * clientHeight;
    } else {
      self.__minDecelerationScrollLeft = 0;
      self.__minDecelerationScrollTop = 0;
      self.__maxDecelerationScrollLeft = self.__maxScrollLeft;
      self.__maxDecelerationScrollTop = self.__maxScrollTop;
    }
    // Wrap class method
    var step = function (percent: number, now: number, render: boolean) {
      self.__stepThroughDeceleration(render);
    };
    // 需要多少速度才能保持减速运行
    var minVelocityToKeepDecelerating = self.options.snapping ? 4 : 0.1;
    // 检测是否仍然值得继续动画步骤
    // 如果我们已经慢到用户无法察觉的程度，我们就在这里停止整个过程。
    var verify = function () {
      var shouldContinue = Math.abs(self.__decelerationVelocityX) >= minVelocityToKeepDecelerating || Math.abs(self.__decelerationVelocityY) >= minVelocityToKeepDecelerating;
      if (!shouldContinue) {
        self.__didDecelerationComplete = true;
      }
      return shouldContinue;
    };

    var completed = function () {
      self.__isDecelerating = false;
      if (self.__didDecelerationComplete) {
        self.options.scrollingComplete();
      }
      // 当捕捉处于活动状态时，动画到网格，否则只需修复边界外的位置
      self.scrollTo(self.__scrollLeft, self.__scrollTop, self.options.snapping);
    };
    // 开始动画并打开标志
    self.__isDecelerating = Animate.start(step, verify, completed);
  }


  /*** 在动画的每个步骤上调用
*
* @param inMemory {Boolean?false} 是否不渲染当前步骤，而仅将其保留在内存中。仅供内部使用！
   */
  __stepThroughDeceleration(render?: boolean) {

    var self = this;


    //
    // COMPUTE NEXT SCROLL POSITION
    //

    // Add deceleration to scroll position
    var scrollLeft = self.__scrollLeft + self.__decelerationVelocityX;
    var scrollTop = self.__scrollTop + self.__decelerationVelocityY;


    //
    // HARD LIMIT SCROLL POSITION FOR NON BOUNCING MODE
    //

    if (!self.options.bouncing) {

      var scrollLeftFixed = Math.max(Math.min(self.__maxDecelerationScrollLeft, scrollLeft), self.__minDecelerationScrollLeft);
      if (scrollLeftFixed !== scrollLeft) {
        scrollLeft = scrollLeftFixed;
        self.__decelerationVelocityX = 0;
      }

      var scrollTopFixed = Math.max(Math.min(self.__maxDecelerationScrollTop, scrollTop), self.__minDecelerationScrollTop);
      if (scrollTopFixed !== scrollTop) {
        scrollTop = scrollTopFixed;
        self.__decelerationVelocityY = 0;
      }

    }


    //
    // UPDATE SCROLL POSITION
    //

    if (render) {

      self.__publish(scrollLeft, scrollTop, self.__zoomLevel);

    } else {

      self.__scrollLeft = scrollLeft;
      self.__scrollTop = scrollTop;

    }


    //
    // SLOW DOWN
    //

    // Slow down velocity on every iteration
    if (!self.options.paging) {
      // 这是应用于动画每次迭代的因素
      // 以减慢进程。这应该模拟自然行为，其中
      // 当移动发起者被移除时，物体会减速
      var frictionFactor = self.options.decelerationRate;

      self.__decelerationVelocityX *= frictionFactor;
      self.__decelerationVelocityY *= frictionFactor;
    }
    //
    // BOUNCING SUPPORT
    //
    if (self.options.bouncing) {
      var scrollOutsideX = 0;
      var scrollOutsideY = 0;
      // 这配置了到达边界时减速/加速的变化量
      var penetrationDeceleration = self.options.penetrationDeceleration;
      var penetrationAcceleration = self.options.penetrationAcceleration;

      // Check limits
      if (scrollLeft < self.__minDecelerationScrollLeft) {
        scrollOutsideX = self.__minDecelerationScrollLeft - scrollLeft;
      } else if (scrollLeft > self.__maxDecelerationScrollLeft) {
        scrollOutsideX = self.__maxDecelerationScrollLeft - scrollLeft;
      }

      if (scrollTop < self.__minDecelerationScrollTop) {
        scrollOutsideY = self.__minDecelerationScrollTop - scrollTop;
      } else if (scrollTop > self.__maxDecelerationScrollTop) {
        scrollOutsideY = self.__maxDecelerationScrollTop - scrollTop;
      }
      // 减速直到足够慢，然后翻转回捕捉位置
      if (scrollOutsideX !== 0) {
        if (scrollOutsideX * self.__decelerationVelocityX <= 0) {
          self.__decelerationVelocityX += scrollOutsideX * penetrationDeceleration;
        } else {
          self.__decelerationVelocityX = scrollOutsideX * penetrationAcceleration;
        }
      }

      if (scrollOutsideY !== 0) {
        if (scrollOutsideY * self.__decelerationVelocityY <= 0) {
          self.__decelerationVelocityY += scrollOutsideY * penetrationDeceleration;
        } else {
          self.__decelerationVelocityY = scrollOutsideY * penetrationAcceleration;
        }
      }
    }
  }
}


// Easing Equations (c) 2003 Robert Penner, all rights reserved.
// Open source under the BSD License.

/**
 * @param pos {Number} position between 0 (start of effect) and 1 (end of effect)
**/
var easeOutCubic = function (pos) {
  return (Math.pow((pos - 1), 3) + 1);
};

/**
 * @param pos {Number} position between 0 (start of effect) and 1 (end of effect)
**/
var easeInOutCubic = function (pos) {
  if ((pos /= 0.5) < 1) {
    return 0.5 * Math.pow(pos, 3);
  }

  return 0.5 * (Math.pow((pos - 2), 3) + 2);
};
