import type { EmptyFun } from 'wy-helper';

/**
 * 延时调度（对标 Kotlin `Timer.kt` 的 `postDelayed`）。
 *
 * 与渲染无关的时间驱动逻辑（Toast 定时关闭、浮层淡出、延迟刷新）用它：
 * 即使没有后续重绘也能按时触发——这与"把动作挂到下一次重绘"完全不同。
 *
 * 本层是薄封装：宿主若有自己的调度器（如 requestAnimationFrame 驱动的
 * 虚拟时钟、测试里的假时钟），可替换 [setPostDelayed] 的实现，
 * 全部调用点自动跟随。
 */

let postDelayedImpl: (delayMs: number, action: EmptyFun) => EmptyFun = (
  delayMs,
  action
) => {
  const id = setTimeout(action, delayMs);
  return () => clearTimeout(id);
};

/**
 * 替换全局延时实现（测试 / 虚拟时钟用）。
 * 返回上一个实现，便于临时替换后还原。
 */
export function setPostDelayed(
  impl: (delayMs: number, action: EmptyFun) => EmptyFun
): (delayMs: number, action: EmptyFun) => EmptyFun {
  const prev = postDelayedImpl;
  postDelayedImpl = impl;
  return prev;
}

/**
 * [delayMs] 毫秒后执行 [action]，返回取消句柄（重复调用无副作用）。
 * 已执行过再取消是安全的空操作。
 */
export function postDelayed(delayMs: number, action: EmptyFun): EmptyFun {
  return postDelayedImpl(delayMs, action);
}

/**
 * 延时 + 可重置：再次调用会取消上一次并重新计时。
 *
 * 典型场景是"用户一直在滚，浮层一直在：停手 N 毫秒后才淡出"——
 * 每次活动把它推后，只有真正静止才触发。
 */
export function createPostDelayed() {
  let cancel: EmptyFun | null = null;
  return {
    post(delayMs: number, action: EmptyFun): void {
      cancel?.();
      cancel = postDelayed(delayMs, () => {
        cancel = null;
        action();
      });
    },
    cancel(): void {
      cancel?.();
      cancel = null;
    },
  };
}

/**
 * 周期调度（对标 Kotlin 协程的 `delay` 循环）—— 目前只有编辑器光标闪烁用它。
 *
 * 单独做一层的原因与 [postDelayed] 相同：**节奏是宿主的事**。
 * 浏览器用 `setInterval`、Kotlin 用协程、测试用假时钟；
 * 引擎层（`editable/editor`）只表达"每 N 毫秒做一次"，不碰宿主 API。
 */
let repeatEveryImpl: (intervalMs: number, action: EmptyFun) => EmptyFun = (
  intervalMs,
  action
) => {
  const id: unknown = setInterval(action, intervalMs);
  // node 下定时器会吊住进程（浏览器返回数字，没有 unref）：有就顺手 unref
  const unref = (id as { unref?: EmptyFun } | null)?.unref;
  if (typeof unref === 'function') unref.call(id);
  return () => clearInterval(id as ReturnType<typeof setInterval>);
};

/** 替换全局周期实现（测试 / 虚拟时钟 / 协程驱动用），返回上一个实现 */
export function setRepeatEvery(
  impl: (intervalMs: number, action: EmptyFun) => EmptyFun
): (intervalMs: number, action: EmptyFun) => EmptyFun {
  const prev = repeatEveryImpl;
  repeatEveryImpl = impl;
  return prev;
}

/** 每 [intervalMs] 毫秒执行一次 [action]，返回停止句柄（重复调用无副作用） */
export function repeatEvery(intervalMs: number, action: EmptyFun): EmptyFun {
  return repeatEveryImpl(intervalMs, action);
}
