import type { Node2 } from './tree/protocol';
import type { SelPair2, Selectable2 } from './tree/interaction';
import type { RichTextStyle } from '../canvasCore/Paragraph';
import type { RichSegment } from './editable/richSegments';
import { EditorHandleExt } from './tree/protocol';
import type { KeyEvent2 } from './tree/protocol';
import { activeEditorSignal } from './tree/engineGlobal';
import {
  focusedSignal,
  pressedSignal,
  ctrlSignal,
  shiftSignal,
  altSignal,
  metaSignal,
  isFocused,
  requestFocus,
  clearFocus,
  isPressed,
  applyModifiers,
  clearModifiers,
  registerKeyPress,
  notifyKeyPress,
} from './tree/engineGlobal';

/**
 * 协议层类型 / 标记不再从这里再导出：`Node` 已 `export *` 透传 `tree/protocol`
 * （KeyEvent2 / KeyCode2 / Node2Messages / EditorHandleExt），若 Focus 再转发会与
 * `index.ts` 的两路 `export *` 撞名被静默丢弃。需要它们的内部调用方直接 import
 * 自 `tree/protocol`。
 */

/** 引擎全局状态再导出（下沉到 `tree/engineGlobal` 后这里转发） */
export {
  focusedSignal,
  activeEditorSignal,
  pressedSignal,
  ctrlSignal,
  shiftSignal,
  altSignal,
  metaSignal,
  isFocused,
  requestFocus,
  clearFocus,
  isPressed,
  applyModifiers,
  clearModifiers,
  registerKeyPress,
  notifyKeyPress,
};

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
  /** 编程式设置选区内光标区间（双击选词 / 三击选段 / 程序化 select 的落点） */
  selectRange(anchorOffset: number, focusOffset: number): void;
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

  // ---------- 公开编辑动作（工具栏按钮 / 快捷键面板可直接调） ----------
  // 与 Kotlin `EditableTextNode` 的公开方法一一对应；键盘路由只是这些动作的一张映射表。
  /** 是否可撤销 */
  canUndo(): boolean;
  /** 是否可重做 */
  canRedo(): boolean;
  undo(): void;
  redo(): void;
  /** 行首 / 行尾（软行） */
  moveHome(): void;
  moveEnd(): void;
  selectHome(): void;
  selectEnd(): void;
  /** 文首 / 文末 */
  moveDocStart(): void;
  moveDocEnd(): void;
  selectDocStart(): void;
  selectDocEnd(): void;
  /** 按词移动 / 扩选 */
  movePrevWord(): void;
  moveNextWord(): void;
  selectPrevWord(): void;
  selectNextWord(): void;
  /** 删除光标后一个字素簇（Delete 键语义） */
  deleteForward(): void;
  /** 把光标定位到逻辑偏移处（越界钳制） */
  moveCursorTo(offset: number): void;
}

/** 从节点 exts 取编辑器句柄；非编辑器返回 null */
export function asEditorHandle2(node: Node2): EditableTextHandle | undefined {
  return node.findExt(EditorHandleExt)?.impl as EditableTextHandle | undefined;
}

/** 节点是否实现编辑器句柄（从 exts 里的 EditorHandleExt 识别，无需注册表） */
export function isEditorHandle(node: unknown): boolean {
  return node != null && asEditorHandle2(node as Node2) != null;
}

/**
 * 富文本编辑器句柄：在 [EditableTextHandle] 之上额外暴露样式段读写
 * （工具栏的加粗 / 着色按钮经此作用到选区）。普通文本编辑器不挂此 ext。
 */
export interface RichEditableHandle {
  /** 当前样式段边界表 */
  getSegments(): readonly RichSegment[];
  /** 把区间 [start, end) 设为 [style]（null = 回到基础样式） */
  setStyleRange(start: number, end: number, style: RichTextStyle | null): void;
}

/** 富文本句柄标记（挂在节点 exts 上） */
export class RichEditableHandleExt {
  constructor(readonly impl: RichEditableHandle) {}
}

/** 从节点 exts 取富文本句柄；非富文本编辑器返回 null */
export function asRichEditable2(node: Node2): RichEditableHandle | undefined {
  return node.findExt(RichEditableHandleExt)?.impl;
}

/** 节点是否实现富文本句柄（从 exts 里的 RichEditableHandleExt 识别） */
export function isRichEditable(node: unknown): boolean {
  return node != null && asRichEditable2(node as Node2) != null;
}

/**
 * 当前活跃编辑器（对齐旧版 canvasRender 的 getActiveEditor）：返回强类型的
 * 编辑器句柄。底层 `activeEditorSignal` 存的是协议层标记（含 `impl` 为 unknown），
 * 这里把 `impl` 取出来还原成 `EditableTextHandle`。
 */
export function getActiveEditor(): EditableTextHandle | undefined {
  return activeEditorSignal.get()?.impl as EditableTextHandle | undefined;
}
