import { createSignal } from 'wy-helper';
import type { EmptyFun } from 'wy-helper';
import type { Node2 } from './protocol';
import { EditorHandleExt } from './protocol';
import type { KeyEvent2 } from './protocol';

/**
 * 引擎级全局状态（焦点 / 按压 / 修饰键 / 全局按键旁听）。
 *
 * 与 `tree/protocol` 同属「算法层可依赖、但不依赖具体节点的纯模块」：
 * 树算法（`messages` 的默认实现、`dispatch` 的派发、`focusWalk` 的焦点遍历）
 * 只向这里读信号 / 写状态，不碰宿主。宿主（`Renderer`）负责把 DOM 事件灌进来、
 * 把全局焦点喂给键盘 / IME 路由。
 *
 * 单 Renderer / 单 Canvas 约定（与 Kotlin 进程级全局一致），多 Canvas 迁移期可接受。
 * 从 `Focus.ts` 下沉到这里是为了切断 `tree/*` 对 `../Focus` 的依赖环：
 * `Focus` 现在只 re-export 本文件 + 持有编辑器句柄的强类型（`EditableTextHandle`）。
 */

/** 焦点真相源（对标 Kotlin `EngineGlobal.focused`） */
export const focusedSignal = createSignal<Node2 | null>(null);

/**
 * 当前活跃编辑器标记（键盘 / IME / 剪贴板快捷键的路由目标）。
 * 存的是协议层的标记实例（含 `impl`），强类型句柄由 `Focus.getActiveEditor` 取。
 */
export const activeEditorSignal = createSignal<EditorHandleExt | undefined>(
  undefined
);

/**
 * 按压态真相源（对标 Kotlin `EngineGlobal.pressed`）：最近一次左键按下落到的叶子节点。
 * 与焦点解耦：焦点可能已转移，但"正按住谁"是另一回事。
 */
export const pressedSignal = createSignal<Node2 | null>(null);

/** 修饰键实时状态（对标 Kotlin `EngineGlobal.ctrl/shift/alt/meta`），与鼠标事件解耦 */
export const ctrlSignal = createSignal(false);
export const shiftSignal = createSignal(false);
export const altSignal = createSignal(false);
export const metaSignal = createSignal(false);

/** 全局按键旁听（对标 Kotlin `EngineGlobal.registerKeyPress`）：节点都没消费的按键广播到这里 */
const keyPressListeners = new Set<(e: KeyEvent2) => void>();

/** 当前是否持有焦点（响应式读取，焦点变化自动触发重绘） */
export function isFocused(node: Node2): boolean {
  return focusedSignal.get() === node;
}

/** 请求获得焦点；编辑器节点自动登记为活跃编辑器，否则清空活跃编辑器 */
export function requestFocus(node: Node2): void {
  focusedSignal.set(node);
  activeEditorSignal.set(node.findExt(EditorHandleExt));
}

/** 清空焦点（如窗口失焦） */
export function clearFocus(): void {
  focusedSignal.set(null);
  activeEditorSignal.set(undefined);
}

/** 当前是否正被按住（响应式） */
export function isPressed(node: Node2): boolean {
  return pressedSignal.get() === node;
}

/** 宿主上报修饰键快照 */
export function applyModifiers(
  ctrl: boolean,
  shift: boolean,
  alt: boolean,
  meta: boolean
): void {
  ctrlSignal.set(ctrl);
  shiftSignal.set(shift);
  altSignal.set(alt);
  metaSignal.set(meta);
}

/** 清空修饰键（窗口失焦等，防止修饰键残留） */
export function clearModifiers(): void {
  applyModifiers(false, false, false, false);
}

/** 注册全局按键旁听，返回注销句柄 */
export function registerKeyPress(callback: (e: KeyEvent2) => void): EmptyFun {
  keyPressListeners.add(callback);
  return () => {
    keyPressListeners.delete(callback);
  };
}

/** 广播一次未被消费的按键（Renderer 在路由结束后调用） */
export function notifyKeyPress(e: KeyEvent2): void {
  keyPressListeners.forEach(cb => cb(e));
}
