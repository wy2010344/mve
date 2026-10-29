import { emptyFun, run } from 'wy-helper';
import type { EmptyFun } from 'wy-helper';
import { createContext } from 'mve-core';
import type { Context } from 'mve-core';

/**
 * 全局鼠标注册表（TS / ooc 共用）。
 *
 * 这里**没有任何宿主 API**：只是一组回调集合 + 广播入口。
 * 宿主（Renderer / ooc 的宿主）在收到真实事件时调 `emitDown/Move/Up`，
 * 节点侧则经 context 拿到 `GlobalMouse2` 注册回调——典型用途是拖拽：
 * 指针移出节点甚至移出画布后仍要持续收到 move/up。
 *
 * 滚轮**不在**这里：它沿命中链派发（`mouseWheel` 消息），这样才能"内层先滚、
 * 滚到底再传给外层"并被节点 `stopPropagation` 拦住。
 */
export interface GlobalMouse2 {
  /** 全局按下：坐标相对画布，不依赖命中测试（拖拽起手后接管会话） */
  registerMouseDown(callback: (x: number, y: number) => void): EmptyFun;
  registerMouseMove(callback: (x: number, y: number) => void): EmptyFun;
  registerMouseUp(callback: EmptyFun): EmptyFun;
}

export const globalMouse2Context = createContext<GlobalMouse2 | null>(null);

/** 注册表本体 + 宿主侧广播入口 */
export interface GlobalMouseRegistry2 {
  /** 提供给节点树的能力对象（经 context 注入） */
  readonly api: GlobalMouse2;
  emitDown(x: number, y: number): void;
  emitMove(x: number, y: number): void;
  emitUp(): void;
  /** 销毁时清空全部注册（避免残留闭包） */
  clear(): void;
}

export function createGlobalMouse2(): GlobalMouseRegistry2 {
  const downCallbacks = new Set<(x: number, y: number) => void>();
  const moveCallbacks = new Set<(x: number, y: number) => void>();
  const upCallbacks = new Set<EmptyFun>();

  const register =
    <T>(set: Set<T>) =>
    (callback: T): EmptyFun => {
      set.add(callback);
      return () => {
        set.delete(callback);
      };
    };

  return {
    api: {
      registerMouseDown: register(downCallbacks),
      registerMouseMove: register(moveCallbacks),
      registerMouseUp: register(upCallbacks),
    },
    emitDown(x, y) {
      downCallbacks.forEach(cb => cb(x, y));
    },
    emitMove(x, y) {
      moveCallbacks.forEach(cb => cb(x, y));
    },
    emitUp() {
      upCallbacks.forEach(run);
    },
    clear() {
      downCallbacks.clear();
      moveCallbacks.clear();
      upCallbacks.clear();
    },
  };
}

/**
 * 通用拖拽助手（对标旧版 canvasRender 的 helper/drag）：
 * 起手后接管全局 move，松手时以最后坐标再回调一次并自动摘除注册，
 * 避免每次拖拽在注册表里残留闭包。返回一个提前终止拖拽的函数。
 *
 * 只依赖"能 consume 一个 context"这一条宿主入口，不认识 DOM。
 */
export function dragMouse(
  ctx: { consume: <T>(context: Context<T>) => T },
  change: (x: number, y: number) => void
): EmptyFun {
  const g = ctx.consume(globalMouse2Context);
  if (!g) return emptyFun;
  let lastX = NaN;
  let lastY = NaN;
  const offMove = g.registerMouseMove((x, y) => {
    lastX = x;
    lastY = y;
    change(x, y);
  });
  const offUp = g.registerMouseUp(() => {
    offMove();
    offUp();
    if (!Number.isNaN(lastX)) change(lastX, lastY);
  });
  return () => {
    offMove();
    offUp();
  };
}
