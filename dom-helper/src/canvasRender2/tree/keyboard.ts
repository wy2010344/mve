import { KeyCode2 } from './protocol';
import type { KeyEvent2 } from './protocol';
import type { Node2 } from './protocol';

/**
 * # 键盘路由（TS / ooc 共用）
 *
 * 这里只放**规则**：谁先拿到按键、什么组合键算全局快捷键、Tab 什么时候才切焦点。
 * 具体动作（写编辑器、改选择器、动全局焦点、吞默认行为）全由 `deps` 提供。
 *
 * 分层理由：规则在 ooc 里是"向能力对象发消息的顺序"，动作才是宿主自己的事
 * （浏览器要 `preventDefault`，ooc 侧不需要）。这样规则可以两侧共用而不夹带宿主。
 */

/**
 * 键盘消费目标的最小契约。
 * 只要"能处理键盘事件"就算——编辑器句柄、普通节点都满足（结构化），
 * 路由不关心它到底是什么，也不读它别的成员。
 */
export interface KeyTarget2 {
  handleKey(e: KeyEvent2): boolean;
}

export interface KeyRouterDeps {
  /** 输入法组合中：键盘归输入法独占，整条路由放弃 */
  composing(): boolean;
  /** 当前活跃编辑器（无则 undefined） */
  activeEditor(): KeyTarget2 | undefined;
  /** 当前焦点节点（无则 null） */
  focused(): Node2 | null;
  /** 全选：编辑器存在时写进编辑器本地光标，否则走选择器 */
  selectAll(): void;
  copy(): void;
  cut(): void;
  /** 粘贴：内容由宿主的 paste 事件异步提供，这里只负责吞掉默认行为 */
  pastePending(): void;
  /** Tab 焦点遍历；返回是否真的移动了焦点 */
  moveFocus(forward: boolean): boolean;
  /** 谁都没消费的按键：广播给全局旁听者（快捷键面板 / 调试） */
  notifyUnhandled(event: KeyEvent2): void;
}

/**
 * 处理一次按键，返回宿主是否需要 `preventDefault`（即"已被消费"）。
 *
 * 顺序与 Kotlin Renderer.handleKey 对齐：
 * 1. 组合输入期间直接放弃；
 * 2. 全局快捷键（Ctrl/Cmd + A/C/X/V，且不带 Alt）；
 * 3. 活跃编辑器优先（节点消息，编辑器会自己处理 Tab 插入等）；
 * 4. 其它焦点节点；
 * 5. 都没消费才轮到 Tab 焦点遍历，且排除 Alt/Ctrl/Meta 组合（Alt+Tab 交给系统）。
 */
export function routeKeyEvent(deps: KeyRouterDeps, event: KeyEvent2): boolean {
  if (deps.composing()) return false;

  const editor = deps.activeEditor();
  const accel = event.ctrl || event.meta;
  if (accel && !event.alt) {
    const k = event.key.toLowerCase();
    if (k === 'a') {
      deps.selectAll();
      return true;
    }
    if (k === 'c') {
      deps.copy();
      return true;
    }
    if (k === 'x') {
      deps.cut();
      return true;
    }
    if (k === 'v') {
      deps.pastePending();
      return true;
    }
  }

  // 先给焦点节点/编辑器消费（对齐 Kotlin Renderer.handleKey：节点优先，
  // 未被消费才走 Tab 焦点遍历）。否则编辑器永远拿不到 Tab（无法插入 \t）。
  if (editor && editor.handleKey(event)) return true;

  const focused = deps.focused();
  if (
    focused &&
    (focused as unknown) !== (editor as unknown) &&
    focused.handleKey(event)
  ) {
    return true;
  }

  if (event.code === KeyCode2.Tab) {
    if (!event.alt && !event.ctrl && !event.meta) {
      return deps.moveFocus(!event.shift);
    }
  }
  // 到这儿说明没人认领：交给全局旁听（不影响返回值，仍视为未消费）
  deps.notifyUnhandled(event);
  return false;
}
