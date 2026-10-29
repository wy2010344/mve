import type { NodeHit2 } from './geometry';
import {
  createMouseEvent2,
  CursorType2,
  EditorHandleExt,
  POINTER_BUTTON_LEFT,
} from './protocol';
import type { MouseEvent2, MouseType2, PointerDevice } from './protocol';

/**
 * 指针派发（TS 与 ooc 共用的**纯消息**流程）。
 *
 * 顺序固定：命中链上先**捕获**（根 → 叶）再**冒泡**（叶 → 根），
 * 任一阶段 `stopPropagation()` 即整体中断（对标 Kotlin `dispatchPointer`）。
 * **所有类型都走这两个阶段**（含右键菜单 / 双击 / 滚轮）——捕获阶段是
 * "外层先知道、可拦截"的唯一位置，滚轮嵌套滚动就靠它。
 *
 * 不检查成员是否存在：指针钩子在协议里是必答消息（缺省走兜底对象的空实现），
 * 所以这里可以直接发消息——ooc 侧同样（不能查"有没有这个方法"）。
 */

export type { MouseType2 };

/**
 * 一次派发的公共输入（局部坐标由命中链提供，这里只带全局量与按键状态）。
 *
 * 之所以做成一个对象而不是长参数表：ooc 侧就是 `dispatchMousePath $ path init`，
 * 加字段时两侧都不用改签名。
 */
export interface MouseDispatchInit {
  readonly type: MouseType2;
  readonly globalX: number;
  readonly globalY: number;
  /** 输入设备（鼠标 / 触摸 / 触控笔） */
  readonly device: PointerDevice;
  /** 指针编号（多点触控区分；鼠标恒 0） */
  readonly pointerId: number;
  /** 触发本次事件的按键编号 */
  readonly button: number;
  /** 当前按住的按键位掩码 */
  readonly buttons: number;
  readonly wheelDeltaX: number;
  readonly wheelDeltaY: number;
}

/** 最简派发入参：只要类型与全局坐标，其余取默认值 */
export function mouseDispatchOf(
  type: MouseType2,
  globalX: number,
  globalY: number
): MouseDispatchInit {
  return {
    type,
    globalX,
    globalY,
    device: 'mouse',
    pointerId: 0,
    button: 0,
    buttons: 0,
    wheelDeltaX: 0,
    wheelDeltaY: 0,
  };
}

/** 向单个节点发一条指针消息；返回事件是否被中断 */
function sendMouse(
  target: NodeHit2['node'],
  event: MouseEvent2,
  capture: boolean
): boolean {
  switch (event.type) {
    case 'click':
      if (capture) target.mouseClickCapture(event);
      else target.mouseClick(event);
      break;
    case 'down':
      if (capture) target.mouseDownCapture(event);
      else target.mouseDown(event);
      break;
    case 'up':
    case 'cancel':
      // 取消与抬起走同一组钩子（对标 Kotlin：Cancel → onPointerUp）
      if (capture) target.mouseUpCapture(event);
      else target.mouseUp(event);
      break;
    case 'move':
      if (capture) target.mouseMoveCapture(event);
      else target.mouseMove(event);
      break;
    case 'wheel':
      if (capture) target.mouseWheelCapture(event);
      else target.mouseWheel(event);
      break;
    case 'contextmenu':
      if (capture) target.mouseContextMenuCapture(event);
      else target.mouseContextMenu(event);
      break;
    case 'dblclick':
      if (capture) target.mouseDoubleClickCapture(event);
      else target.mouseDoubleClick(event);
      break;
  }
  return event.stoppedProgression;
}

/**
 * 沿命中链派发：捕获（根 → 叶）→ 冒泡（叶 → 根）。
 * 返回是否被 `stopPropagation()` 中断（滚轮用它决定要不要再交给外层/页面）。
 */
export function dispatchMousePath(
  path: readonly NodeHit2[],
  init: MouseDispatchInit
): boolean {
  // 捕获阶段：根 → 叶
  for (let index = 0; index < path.length; index++) {
    if (sendMouse(path[index].node, eventOf(path[index], init), true)) {
      return true;
    }
  }
  // 冒泡阶段：叶 → 根
  for (let index = path.length - 1; index >= 0; index--) {
    if (sendMouse(path[index].node, eventOf(path[index], init), false)) {
      return true;
    }
  }
  return false;
}

/** 每个节点拿到的坐标是**相对该节点**的局部坐标 */
function eventOf(it: NodeHit2, init: MouseDispatchInit): MouseEvent2 {
  return createMouseEvent2({
    type: init.type,
    x: it.x,
    y: it.y,
    globalX: init.globalX,
    globalY: init.globalY,
    device: init.device,
    pointerId: init.pointerId,
    button: init.button,
    buttons: init.buttons,
    wheelDeltaX: init.wheelDeltaX,
    wheelDeltaY: init.wheelDeltaY,
  });
}

/**
 * 光标派生（对标 Kotlin `cursorTrack`）：
 * 叶子优先——节点显式 `cursor()` 优先；其次编辑器 → text，可聚焦 → pointer，
 * 否则 default。全部按消息读取，不关心节点到底是谁。
 */
export function cursorOfPath(path: readonly NodeHit2[] | null): CursorType2 {
  let pointer = false;
  if (path) {
    for (let i = path.length - 1; i >= 0; i--) {
      const n = path[i].node;
      const c = n.cursor();
      if (c) return c;
      if (n.findExt(EditorHandleExt)) return CursorType2.TEXT;
      if (n.focusable()) pointer = true;
    }
  }
  return pointer ? CursorType2.POINTER : CursorType2.DEFAULT;
}

/** 该节点是否在命中链上（hover / pressed 判定用） */
export function pathIncludes(
  path: readonly NodeHit2[] | null,
  node: unknown
): boolean {
  if (!path) return false;
  return path.some(it => (it.node as unknown) === node);
}

/** 命中点是否落在左键上（右键不进入拖选等左键专属行为） */
export function isPrimaryButton(button: number): boolean {
  return button === POINTER_BUTTON_LEFT;
}
