import { EmptyFun } from 'wy-helper';
import { Context, createContext } from 'mve-core';

export interface GlobalMouseEvent {
  x: number;
  y: number;
  destroy: EmptyFun;
}

export type MouseCallback = (e: GlobalMouseEvent) => void;

export interface GlobalWheelEvent {
  x: number;
  y: number;
  delta: number;
  destroy: EmptyFun;
}

export type WheelCallback = (e: GlobalWheelEvent) => void;

export interface EngineGlobal {
  registerMouseMove(callback: MouseCallback): EmptyFun;
  registerMouseUp(callback: MouseCallback): EmptyFun;
  registerMouseWheel(callback: WheelCallback): EmptyFun;
}

export const engineGlobalContext = createContext<EngineGlobal | null>(null);
