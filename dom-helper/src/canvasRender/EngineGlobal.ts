import { EmptyFun } from 'wy-helper';
import { Context, createContext } from 'mve-core';
import type { CursorType } from '../canvasCore/Cursor';
import type { Node, NodeWithPosition } from './Node';

export { CursorType } from '../canvasCore/Cursor';

export interface GlobalMouseEvent {
  x: number;
  y: number;
  destroy: EmptyFun;
}

export type MouseCallback = (e: GlobalMouseEvent) => void;

export interface GlobalWheelEvent {
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  destroy: EmptyFun;
}

export type WheelCallback = (e: GlobalWheelEvent) => void;

export enum KeyCode {
  Backspace = 'Backspace',
  Delete = 'Delete',
  Left = 'Left',
  Right = 'Right',
  Home = 'Home',
  End = 'End',
  Up = 'Up',
  Down = 'Down',
  PageUp = 'PageUp',
  PageDown = 'PageDown',
  Enter = 'Enter',
  Tab = 'Tab',
  Escape = 'Escape',
  Unknown = 'Unknown',
}

export interface KeyEvent {
  key: string;
  code: KeyCode;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

export type KeyPressCallback = (e: KeyEvent) => void;
export type ComposingTextCallback = (
  text: string,
  cursorPosition: number
) => void;

/** 鼠标光标类型：实现在 `canvasCore/Cursor`，两套树共用一份（见文件顶部 re-export） */

export interface EngineGlobal {
  registerMouseDown(callback: MouseCallback): EmptyFun;
  registerMouseMove(callback: MouseCallback): EmptyFun;
  registerMouseUp(callback: MouseCallback): EmptyFun;
  registerMouseWheel(callback: WheelCallback): EmptyFun;
  registerKeyPress(callback: KeyPressCallback): EmptyFun;
  registerComposingText(callback: ComposingTextCallback): EmptyFun;

  pressed(): boolean;
  moveHitest(): NodeWithPosition | null;

  focused(): Node | null;
  setFocused(node: Node | null): void;

  /** 请求平台在指定屏幕坐标显示原生输入控件（隐藏的 textarea），用于代理文本输入和 IME 组合 */
  requestInputOverlay(
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number
  ): void;

  /** 隐藏原生输入控件 */
  hideInputOverlay(): void;

  /** 请求平台切换鼠标光标 */
  requestCursor(type: CursorType): void;
}

export const engineGlobalContext = createContext<EngineGlobal | null>(null);
