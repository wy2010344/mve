import type { Layout, LayoutFun, PointKey } from 'wy-helper';
import type { StateHolder } from 'mve-core';
import { CursorType as CursorType2 } from '../../canvasCore/Cursor';

/**
 * # 节点消息协议（TS / ooc / Rust 三侧共用的一份契约）
 *
 * 这里只有**类型**与最外层的数据载体，没有任何树算法——算法在同目录的
 * `geometry`（测量 / 命中）、`dispatch`（鼠标派发）、`focusWalk`（焦点遍历）
 * 里，且全部只**发消息**、不读对象结构。
 *
 * 移植时只需要满足两条：
 *
 * 1. **节点只回答消息**。`node.width()` / `node.children()` / `node.hide()`
 *    这些一律是「向节点发一条消息」，实现方可以是：
 *    - TS：`merge(shell, p)` 出来的普通对象（见 `assemble.ts`）；
 *    - ooc：`merge $ shell p` 得到的委托包装；
 *    - Rust：`struct Node2 { shell 字段, arg: Node2Messages }` + 方法转调。
 *
 * 2. **上层算法不得检查成员是否存在、不得按键取值**。没有 `if (node.mouseClick)`、
 *    没有 `node[key]()`、没有 `{...node}`——因为这些在 ooc 里都不成立
 *    （对象成员固定、不能反射、回到 TS 的对象也不一定是普通 record）。
 *    缺省行为统一由「兜底对象 + merge」提供，所以每条消息**永远答得出来**。
 *
 * 消息分三组：
 * - **结构消息**（`parent` / `children` / `index` / `draw` / `layout*` / `findExt`）：
 *   节点自己的职责，`shell` 提供；
 * - **参数消息**（`Node2Messages`，见 `NodeArg.ts`）：尺寸、内边距、显隐、
 *   鼠标钩子、焦点状态等，`p = merge(arg, defaults)` 提供；
 * - **能力查询**：`findExt(cls)` 是唯一入口，`exts` 集合本身不对外暴露。
 */

export type { Layout, LayoutFun };

export type StartEnd = 'start' | 'end';

export type LayoutSize =
  | {
      readonly value: number;
      readonly fromInside: boolean;
    }
  | number;

export type LayoutSizeDirection = {
  direction: PointKey;
  value: number;
  fromInside: boolean;
};

/** 鼠标光标（= `canvasCore/Cursor` 的 CursorType，两套树共用；`2` 后缀保留以兼容既有导入） */
export { CursorType2 };

/** 输入设备（多点触控 / 触控笔场景用；DOM 侧固定 mouse） */
export type PointerDevice = 'mouse' | 'touch' | 'pen';

/** 指针事件类型（新增取值一律追加到末尾，避免序号漂移） */
export type MouseType2 =
  | 'down'
  | 'move'
  | 'up'
  | 'click'
  | 'cancel'
  | 'wheel'
  | 'dblclick'
  | 'contextmenu';

/** 鼠标按键编号（沿用 AWT `MouseEvent.getButton()`：1=左 2=中 3=右） */
export const POINTER_BUTTON_LEFT = 1;
export const POINTER_BUTTON_MIDDLE = 2;
export const POINTER_BUTTON_RIGHT = 3;
/** 按住位掩码（沿用 AWT 位序：左=1 中=2 右=4） */
export const POINTER_LEFT_DOWN_MASK = 1;
export const POINTER_MIDDLE_DOWN_MASK = 2;
export const POINTER_RIGHT_DOWN_MASK = 4;

/**
 * 按键编号 → 按住位。
 * 未知编号返回 0：宁可少报一个键，也不要把不认识的键混进按住状态里，
 * 让调用方误判成"左键被按住"。
 */
export function pointerButtonMask(button: number): number {
  if (button === POINTER_BUTTON_LEFT) return POINTER_LEFT_DOWN_MASK;
  if (button === POINTER_BUTTON_MIDDLE) return POINTER_MIDDLE_DOWN_MASK;
  if (button === POINTER_BUTTON_RIGHT) return POINTER_RIGHT_DOWN_MASK;
  return 0;
}

/**
 * 派发给节点的指针事件（局部坐标 + 全局坐标 + 按键状态 + 中断标记）。
 *
 * 字段与 Kotlin 的 `PointerEvent` 对齐：`button` 是**触发本次事件**的键，
 * `buttons` 是**当前按住哪些键**的掩码（判断"是否正按住左键拖拽"用它）。
 * 修饰键（Ctrl/Shift…）不放事件里，走全局信号（见 `Focus.ts` 的 modifiers）。
 *
 * ooc 侧同样构造一个只响应这几条消息的对象即可。
 */
export interface MouseEvent2 {
  readonly type: MouseType2;
  readonly device: PointerDevice;
  /** 指针编号（多点触控 / 多笔区分；鼠标恒 0） */
  readonly pointerId: number;
  /** 相对当前节点的局部坐标 */
  readonly x: number;
  readonly y: number;
  /** 相对画布（渲染根）的全局坐标 */
  readonly globalX: number;
  readonly globalY: number;
  /**
   * 触发本次事件的按键编号（**引擎编号**：1=左 / 2=中 / 3=右，0=无按键）。
   *
   * move / wheel / dblclick 等"不来自某个键"的事件为 0。
   * 宿主的原生编号由宿主适配器翻译过来（DOM 的 0=左 → 引擎的 1=左）。
   */
  readonly button: number;
  /** 当前按住的按键位掩码 */
  readonly buttons: number;
  /** 滚轮水平位移（仅 wheel 事件非 0） */
  readonly wheelDeltaX: number;
  /** 滚轮垂直位移（仅 wheel 事件非 0） */
  readonly wheelDeltaY: number;
  /** 压感（鼠标恒 1） */
  readonly pressure: number;
  readonly stoppedProgression: boolean;
  stopPropagation(): void;
}

/** 构造指针事件的入参（宿主侧填，缺省项由 [createMouseEvent2] 兜底） */
export interface MouseEventInit2 {
  readonly type: MouseType2;
  readonly x: number;
  readonly y: number;
  readonly globalX: number;
  readonly globalY: number;
  readonly device?: PointerDevice;
  readonly pointerId?: number;
  readonly button?: number;
  readonly buttons?: number;
  readonly wheelDeltaX?: number;
  readonly wheelDeltaY?: number;
  readonly pressure?: number;
}

export function createMouseEvent2(init: MouseEventInit2): MouseEvent2 {
  let stoppedProgression = false;
  return {
    type: init.type,
    device: init.device ?? 'mouse',
    pointerId: init.pointerId ?? 0,
    x: init.x,
    y: init.y,
    globalX: init.globalX,
    globalY: init.globalY,
    button: init.button ?? 0,
    buttons: init.buttons ?? 0,
    wheelDeltaX: init.wheelDeltaX ?? 0,
    wheelDeltaY: init.wheelDeltaY ?? 0,
    pressure: init.pressure ?? 1,
    get stoppedProgression() {
      return stoppedProgression;
    },
    stopPropagation() {
      stoppedProgression = true;
    },
  };
}

/**
 * 键盘事件（对标 Kotlin `KeyEvent`）：平台在每次 keydown 时上报权威快照。
 * `code` 用浏览器 `KeyboardEvent.code`（'Backspace' / 'ArrowLeft' / 'Tab' …），
 * 与 Kotlin 的 `KeyCode` 枚举语义一致，路由时按字符串匹配。
 *
 * 放在协议层：键盘路由（`tree/keyboard`）与焦点 / IME 全局都消费它，属于
 * 「节点 / 引擎之间来回传的消息载体」——它不依赖任何引擎具体实现，所以
 * `tree/*` 不再需要 import `../Focus`。
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

/** 键位常量（对齐 Kotlin `KeyCode` 枚举成员名） */
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
 * 编辑器句柄标记（挂在节点 `exts` 上的标记载体，与 `SelectableExt` 同机制）。
 *
 * 节点结构体不承载 `cursorSelPair` / `handleKey` 等未知字段，统一经 `findExt`
 * 识别。放在协议层是因为「命中链上的节点是不是编辑器」是派发 / 光标派生
 * （`tree/dispatch`）要直问的问题——它只认这个标记类，不关心标记里 `impl`
 * 具体是什么（ooc 侧由内部 Symbol 承担，`impl` 因而留 `unknown`）。
 */
export class EditorHandleExt {
  constructor(readonly impl: unknown) {}
}

/**
 * 参数对象的**消息契约**（从 `NodeArg.ts` 收进协议层）。
 *
 * 节点不持有这些参数，只把它们当消息接收者：`node.hide()` 就是 `p.hide()`。
 * `p` 是「用户参数对象 merge 兜底对象」的中间产物，所以这里的每个成员都必须
 * 有默认实现（见 `tree/messages.ts` 的 `nodeMessageDefaults`）。
 *
 * 与 ooc 的 `p = merge $ arg defaults` 一一对应；Rust 侧对应
 * `ResolvedArgs { hide: Box<dyn Fn() -> bool>, ... }`（字段是 `Option`，
 * 构造时 `unwrap_or(default)`）。整组消息自洽在协议层，便于三侧共用。
 */
export interface Node2Messages {
  //外部显式传递node,可能一些参数配置好了,当this来使用
  x(): number;
  y(): number;
  hide(): boolean;
  acceptHit(x: number, y: number): boolean;
  acceptClip(x: number, y: number): boolean;
  skipDraw(): boolean;
  paddingInlineStart(): number;
  paddingInlineEnd(): number;
  paddingBlockStart(): number;
  paddingBlockEnd(): number;
  width(): number;
  height(): number;
  notInLayout(): boolean;
  selectionEnabled(): boolean;
  /** 是否可被 Tab 焦点遍历拾取（默认 false）；可动态改变 */
  focusable(): boolean;
  /** Tab 遍历显式顺序（默认 null，走文档序）；可动态改变 */
  focusOrder(): number | null;
  /** 是否圈定焦点（模态弹出层；默认 false）；可动态改变 */
  focusTrap(): boolean;
  /** 键盘事件处理（编辑器实现；非编辑器默认不消费） */
  handleKey(e: KeyEvent2): boolean;
  draw(ctx2: CanvasRenderingContext2D, n: Node2): void;
  /**
   * 在父坐标系上的预绘制钩子（可选，默认空实现，对标 Kotlin Node.drawAtParent）：
   * 父节点 draw 时在 translate 到本节点前调用。如 ScrollContent 传入按容器
   * inner 区裁剪的实现。
   */
  drawAtParent(ctx2: CanvasRenderingContext2D): void;
  mouseClick(event: MouseEvent2): void;
  mouseDown(event: MouseEvent2): void;
  mouseUp(event: MouseEvent2): void;
  mouseMove(event: MouseEvent2): void;
  /** 滚轮：沿命中链派发，`stopPropagation()` 可阻止外层继续滚 */
  mouseWheel(event: MouseEvent2): void;
  /** 右键上下文菜单（对标 Kotlin onPointerContextMenu；右键不派发 mouseDown） */
  mouseContextMenu(event: MouseEvent2): void;
  /** 双击（对标 Kotlin onPointerDoubleClick；不吞单击） */
  mouseDoubleClick(event: MouseEvent2): void;
  /** 捕获阶段钩子（根 → 叶，先于冒泡；对标旧版 canvasRender 的 mouse*Capture） */
  mouseClickCapture(event: MouseEvent2): void;
  mouseDownCapture(event: MouseEvent2): void;
  mouseUpCapture(event: MouseEvent2): void;
  mouseMoveCapture(event: MouseEvent2): void;
  mouseWheelCapture(event: MouseEvent2): void;
  mouseContextMenuCapture(event: MouseEvent2): void;
  mouseDoubleClickCapture(event: MouseEvent2): void;
  /** 鼠标光标（悬停时）；返回 null 表示不指定，交给引擎派生 */
  cursor(): CursorType2 | null;
  /** 当前是否持有焦点（读取全局焦点信号，响应式） */
  isFocused(): boolean;
  /** 请求获得焦点（登记为活跃编辑器若为编辑器节点） */
  requestFocus(): void;
  /** IME 预编辑串上报（编辑器实现；非编辑器忽略） */
  onComposing(text: string, cursor: number): void;
  /** 诊断用可读名（只在报错信息里出现，不参与求值） */
  debugName(): string | null;

  size(s: PointKey): LayoutSize;
  paddingInline(s: StartEnd): number;
  paddingBlock(s: StartEnd): number;
  padding(p: PointKey, s: StartEnd): number;
  position(s: PointKey): number;
}

/**
 * 父链上的最小消息集：布局测量 / 绝对坐标只需要这些，
 * 拿不到完整节点时（例如 ooc 里只暴露部分能力的父句柄）也能问。
 */
export interface Node2Parent {
  parent?: Node2Parent;
  x(): number;
  y(): number;
  layoutChildren(): readonly Node2[];
  layoutX(): Layout;
  layoutY(): Layout;
}

/**
 * 节点：只发消息的壳。
 *
 * 结构消息由 `shell` 实现（`draw` 的父子递归、`children`、`layout*`、`findExt`）；
 * 其余消息在运行时来自「参数对象 merge 兜底对象」，类型上在这里完整声明，
 * 保证调用方**无需检查成员是否存在**。
 */
export interface Node2 extends Node2Parent {
  /** 文档序索引 / 布局序索引（可写状态，collectIndex 与 layoutChildren 回填） */
  _index: number;
  _layoutIndex: number;

  // ---------- 结构消息 ----------
  draw(ctx2: CanvasRenderingContext2D): void;
  /**
   * 在父坐标系上的预绘制钩子（对标 Kotlin Node.drawAtParent 重写，默认空实现）：
   * 父节点 draw 循环在 translate 到本节点之前调用——如 ScrollContent 在此按
   * 容器 inner 区裁剪。基类只负责调用，不感知任何具体语义。
   */
  drawAtParent(ctx2: CanvasRenderingContext2D): void;
  index(): number;
  layoutIndex(): number;
  children(): readonly Node2[];
  layout(d: PointKey): LayoutFun<Node2>;
  /**
   * 取节点上的扩展（GrowChild/AlignChild/ScrollContentExt/SelectableExt/…）。
   *
   * 这是节点**唯一**对外暴露的扩展访问入口——`exts` 集合本身不进公共接口，
   * 避免把"有哪些扩展"这种实现细节暴露出去（ooc 侧节点只响应消息、不暴露内部
   * 字段；Rust 侧是私有字段 `exts: Vec<Box<dyn Any>>` + `downcast_ref`；
   * ooc 侧 `instanceof` 由内部 Symbol 承担）。
   */
  findExt<T>(c: new (...vs: any[]) => T): T | undefined;

  // ---------- 参数消息（运行时由 p 兜底，永远答得出来） ----------
  paddingInlineStart(): number;
  paddingInlineEnd(): number;
  paddingBlockStart(): number;
  paddingBlockEnd(): number;
  /** 尺寸只展示外面的，因为 padding 表达内部 */
  width(): number;
  height(): number;
  hide(): boolean;
  notInLayout(): boolean;
  skipDraw(): boolean;
  /** 是否参与文本选择（SelectionManager 遍历时 false 剪枝整棵子树） */
  selectionEnabled(): boolean;
  acceptHit(x: number, y: number): boolean;
  acceptClip(x: number, y: number): boolean;
  /** 鼠标光标（悬停时）；返回 null 表示不指定，由引擎按"编辑器→text / 可聚焦→pointer"派生 */
  cursor(): CursorType2 | null;

  // ---------- 鼠标钩子（默认空实现，派发方直接发消息、不做存在性判断） ----------
  mouseClick(event: MouseEvent2): void;
  mouseDown(event: MouseEvent2): void;
  mouseUp(event: MouseEvent2): void;
  mouseMove(event: MouseEvent2): void;
  /** 滚轮：沿命中链派发，`stopPropagation()` 可阻止外层继续滚 */
  mouseWheel(event: MouseEvent2): void;
  /** 右键上下文菜单（对标 Kotlin onPointerContextMenu；右键不派发 mouseDown） */
  mouseContextMenu(event: MouseEvent2): void;
  /** 双击（对标 Kotlin onPointerDoubleClick；不吞单击——同一次双击仍先派发 click，与 Flutter/Compose 手势一致） */
  mouseDoubleClick(event: MouseEvent2): void;
  /** 捕获阶段钩子（根 → 叶，先于冒泡） */
  mouseClickCapture(event: MouseEvent2): void;
  mouseDownCapture(event: MouseEvent2): void;
  mouseUpCapture(event: MouseEvent2): void;
  mouseMoveCapture(event: MouseEvent2): void;
  mouseWheelCapture(event: MouseEvent2): void;
  mouseContextMenuCapture(event: MouseEvent2): void;
  mouseDoubleClickCapture(event: MouseEvent2): void;

  // ---------- 焦点子系统（对标 Kotlin focusable/focusOrder/focusTrap） ----------
  /**
   * 是否可被 Tab 焦点遍历拾取（相当于 web 的 tabindex >= 0）。
   * 读取式：焦点遍历 / 命中 / 光标派生每次都重新求值，可随状态动态变化。
   */
  focusable(): boolean;
  /** Tab 遍历的显式顺序（值越小越先遍历；null 走文档序），读取式 */
  focusOrder(): number | null;
  /** 是否圈定焦点（模态弹出层；Tab 只在圈定子树内循环），读取式 */
  focusTrap(): boolean;
  /** 当前是否持有焦点（读取全局焦点信号，响应式） */
  isFocused(): boolean;
  /** 请求获得焦点（若为编辑器节点，同时登记为活跃编辑器） */
  requestFocus(): void;
  /** 键盘事件处理；返回 true 表示已消费（默认不消费） */
  handleKey(e: KeyEvent2): boolean;
  /** IME 预编辑串上报（编辑器实现；非编辑器忽略） */
  onComposing(text: string, cursor: number): void;
  /** 诊断用可读名（只在报错信息里出现，不参与求值；默认 null） */
  debugName(): string | null;
}

/** 子表达式：向当前上下文建节点；组件经 `fc` 包成 `create(arg) => Fc`，调用返回 `void` */
export type Fc = (ctx: StateHolder<Node2, readonly Node2[]>) => void;
