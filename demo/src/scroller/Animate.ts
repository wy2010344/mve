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

/**
 * Generic animation class with support for dropped frames both optional easing and duration.
 *
 * Optional duration is useful when the lifetime is defined by another condition than time
 * e.g. speed of an animating object, etc.
 *
 * Dropped frame logic allows to keep using the same updater logic independent from the actual
 * rendering. This eases a lot of cases where it might be pretty complex to break down a state
 * based on the pure time difference.
 */
var time = Date.now || function () {
  return +new Date();
};
var desiredFrames = 60;
var millisecondsPerSecond = 1000;
var running: Record<number, boolean | null> = {};
var counter = 1;
/**
   * Stops the given animation.
   *
   * @param id {Integer} Unique animation ID
   * @return {Boolean} Whether the animation was stopped (aka, was running before)
   */
export function stop(id: number) {
  var cleared = running[id] != null;
  if (cleared) {
    running[id] = null;
  }

  return cleared;
}

/**
  * Whether the given animation is still running.
  *
  * @param id {Integer} Unique animation ID
  * @return {Boolean} Whether the animation is still running
  */
function isRunning(id: number) {
  return running[id] != null;
}
/*** 启动动画。
*
* @param stepCallback {Function} 指向每一步执行的函数的指针。
* 方法的签名应为 `function(percent, now, virtual) { return continueWithAnimation; }`
* @param verifyCallback {Function} 在每个动画步骤之前执行。
* 方法的签名应为 `function() { return continueWithAnimation; }`
* @param completeCallback {Function}
* 方法的签名应为 `function(droppedFrames, finishAnimation) {}`
* @param duration {Integer} 运行动画的毫秒数
* @param easingMethod {Function} 指向缓和函数的指针
* 方法的签名应为 `function(percent) { return modifiedValue; }`
* @param root {Element ? document.body} 渲染根（如果可用）。用于 requestAnimationFrame 的内部
* 使用。
* @return {Integer} 动画标识符。可用于随时停止动画。
  */
export function start(
  stepCallback: (percent: number, now: number, virtual: boolean) => boolean | void,
  verifyCallback: (id: number) => boolean,
  completedCallback: (droppedFrames: number, id: number, finished: boolean) => void,
  duration?: number,
  easingMethod?: (percent: number) => number
): number {
  const start = time();
  var lastFrame = start;
  var percent = 0;
  var dropCounter = 0;
  const id = counter++;
  // 这是每隔几毫秒调用一次的内部步骤方法
  const step = function (virtual?: boolean | number) {
    // Normalize virtual value
    const render = virtual !== true;
    // Get current time
    const now = time();
    // 在下一个动画步骤之前执行验证
    if (!running[id] || (verifyCallback && !verifyCallback(id))) {
      running[id] = null;
      completedCallback?.(
        desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)),
        id,
        false);
      return;
    }
    // 为了应用当前的渲染，让我们更新内存中省略的步骤。
    // 这对于及时更新内部状态变量非常重要。
    if (render) {
      const droppedFrames = Math.round((now - lastFrame) / (millisecondsPerSecond / desiredFrames)) - 1;
      for (var j = 0; j < Math.min(droppedFrames, 4); j++) {
        step(true);
        dropCounter++;
      }
    }
    // Compute percent value
    if (duration) {
      percent = (now - start) / duration;
      if (percent > 1) {
        percent = 1;
      }
    }
    // Execute step callback, then...
    var value = easingMethod ? easingMethod(percent) : percent;
    if ((stepCallback(value, now, render) === false || percent === 1) && render) {
      running[id] = null;
      completedCallback?.(
        desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)),
        id,
        percent === 1 || duration == null);
    } else if (render) {
      lastFrame = now;
      requestAnimationFrame(step);
    }
  };

  // Mark as running
  running[id] = true;

  // Init first step
  requestAnimationFrame(step);

  // Return unique animation ID
  return id;
}