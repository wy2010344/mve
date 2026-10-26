import { createSignal } from 'wy-helper';
import type { Node2 } from './Node';
import type { SelPair2, Selectable2 } from './SelectionManager';

/**
 * 键盘事件（对标 Kotlin KeyEvent）：平台在每次 keydown 时上报权威快照。
 * code 用浏览器 `KeyboardEvent.code`（'Backspace' / 'ArrowLeft' / 'Tab' …），
 * 与 Kotlin 的 KeyCode 枚举语义一致，路由时按字符串匹配。
 */
export interface KeyEvent2 {
  /** 实际字符（可打印键为单字符；控制键为空串或符号） */
  key: string;
  /** 物理键位（KeyboardEvent.code） */
  code: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

/**
 * 原生输入控件（隐藏 textarea）的期望位置，用于把输入法候选框定位到光标处
 * （对标 Kotlin `EngineGlobal.requestInputOverlay(x, y, w, h, fontSize)`）。
 * 坐标为画布内的 CSS 像素（不含 canvas 自身的 left/top）。
 */
export interface InputOverlayRect {
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
}

/** 键位常量（对齐 Kotlin KeyCode 枚举成员名） */
export const KeyCode2 = {
  Backspace: 'Backspace',
  Delete: 'Delete',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
  Up: 'ArrowUp',
  Down: 'ArrowDown',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  Enter: 'Enter',
  Tab: 'Tab',
  Escape: 'Escape',
} as const;

/**
 * 活跃编辑器的统一句柄：焦点落在该节点上时，Renderer 的键盘 / IME / 剪贴板
 * 全局快捷键全部经此路由（对标 Kotlin `EngineGlobal.activeEditor`）。
 * 编辑器节点在实现 Selectable2 的同时实现本接口，焦点切换时由
 * [requestFocus] 自动登记 / 注销。
 */
export interface EditableTextHandle {
  /** 本地光标端点对（活跃编辑器光标选区真相源）；未定位返回 null */
  cursorSelPair(): SelPair2 | null;
  /** 是否存在非塌缩选区 */
  hasSelection(): boolean;
  cut(): void;
  copy(): void;
  paste(): void;
  /** 编辑器内全选（写入本地光标信号） */
  selectAll(): void;
  /** 塌缩外部显式选区（引擎在指针按下落点不在本编辑器时调用） */
  collapseExternalSelection(): void;
  /** IME 预编辑串上报（空串 = 提交并结束组合） */
  onComposing(text: string, cursor: number): void;
  /**
   * 输入法组合结束：以最终串收尾并提交（对标旧版 EditableTextNode.commitComposingText）。
   * 传空串表示放弃本次组合（等价于 onComposing('')）。
   */
  commitComposingText(finalText: string): void;
  /**
   * 原生输入控件的期望位置（光标处），供宿主定位 textarea 让候选框跟随光标。
   * 返回 null 表示不关心（宿主可保持原位）。
   */
  inputOverlay(): InputOverlayRect | null;
  /** 键盘事件处理；返回 true 表示已消费 */
  handleKey(e: KeyEvent2): boolean;
  /** 返回自身作为 Selectable2（供 SelectionManager 派生范围与端点） */
  asSelectable(): Selectable2;
}

/** 节点是否实现编辑器句柄（鸭子类型，无需注册表） */
export function isEditorHandle(
  node: unknown
): node is EditableTextHandle & Node2 {
  return typeof (node as any)?.cursorSelPair === 'function';
}

/**
 * 焦点真相源（对标 Kotlin `EngineGlobal.focused`）：模块级全局信号。
 * canvasRender2 当前约定单 Renderer / 单 Canvas（与 Kotlin 的进程级全局一致）；
 * 多 Canvas 场景会共享同一焦点，迁移期可接受。
 */
export const focusedSignal = createSignal<Node2 | null>(null);

/** 当前活跃编辑器（键盘 / IME / 剪贴板快捷键的路由目标） */
export const activeEditorSignal = createSignal<EditableTextHandle | null>(null);

/** 当前活跃编辑器（对齐旧版 canvasRender 的 getActiveEditor 导出） */
export function getActiveEditor(): (EditableTextHandle & Node2) | null {
  return activeEditorSignal.get() as (EditableTextHandle & Node2) | null;
}

/** 当前持有焦点的节点（响应式读取，焦点变化自动触发重绘） */
export function isFocused(node: Node2): boolean {
  return focusedSignal.get() === node;
}

/** 请求获得焦点；编辑器节点自动登记为活跃编辑器，否则清空活跃编辑器 */
export function requestFocus(node: Node2): void {
  focusedSignal.set(node);
  activeEditorSignal.set(
    isEditorHandle(node) ? (node as unknown as EditableTextHandle) : null
  );
}

/** 清空焦点（如窗口失焦） */
export function clearFocus(): void {
  focusedSignal.set(null);
  activeEditorSignal.set(null);
}
