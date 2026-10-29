import type { NodeHit2 } from './geometry';
import type { Rect2 } from '../geom/rect';
import type { PointerDevice } from './protocol';

/**
 * # 交互数据协议（TS / ooc / Rust 三侧共用的**纯数据**）
 *
 * 这里只有数据形状，没有任何行为——因为跨语言移植时最稳的就是"数据传数据"：
 * - TS 侧这些是普通 interface，宿主直接构造字面量；
 * - ooc 侧是 `{ x: 1; y: 2; .. }` 的对象字面量，逻辑只按字段读；
 * - Rust 侧是 `struct`。
 *
 * 与 `protocol.ts` 的分工：那边是**节点的消息契约**（节点回答什么），
 * 这边是**交互过程中的中间数据**（命中链 / 指针会话 / 可选取文本能力）。
 *
 * 注意：这些对象都不是 `Node2`。凡是"节点的能力"，一律经消息问节点
 * （`node.findExt(cls)` → 能力对象），绝不假设节点上有某个字段。
 */

/** 选中矩形（全局坐标）——就是通用的 [Rect2]，这里只做路径上的再导出 */
export type { Rect2 } from '../geom/rect';

/**
 * 可被选择器统一管理的可选文本区域。
 * 节点是纯数据面，只提供坐标换算与文本查询；选区真相由选择器持有
 * （信号驱动拉模型），节点按需读取范围并绘制高亮，没有任何反向写回。
 *
 * **每条消息都必答**：不具备分词 / 分段能力的实现不要漏写，而是
 * `merge(自己的实现, selectableDefaults)`（见 `selection/selectable`），
 * 由兜底对象返回 null。这样选择器可以直接发消息，不必先探测成员是否存在
 * ——ooc 里也没有"有没有这个方法"这种问法。
 */
export interface Selectable2 {
  /** 选中区域（全局坐标），供 popover 定位；无选区返回 null */
  selectionRect(): Rect2 | null;
  /** 文本总长度（越界钳制 / 全选） */
  textLength(): number;
  /** 全局坐标 → 本节点文本偏移（跨节点拖拽时由目标节点换算） */
  positionForPoint(globalX: number, globalY: number): number;
  /** 读取指定范围文本（selectedText 聚合拼接用） */
  textInRange(start: number, end: number): string;
  /** 包含 offset 的词边界（半开区间），供双击选词；无法分词返回 null */
  wordRangeAt(offset: number): [number, number] | null;
  /** 包含 offset 的逻辑段落范围（半开，'\n' 分隔），供三击选段；不支持返回 null */
  paragraphRangeAt(offset: number): [number, number] | null;
}

/** 选区端点：某个可选节点内的偏移位置 */
export interface SelPoint2 {
  readonly node: Selectable2;
  readonly offset: number;
}

/** 一对端点：锚点与焦点 */
export interface SelPair2 {
  readonly anchor: SelPoint2;
  readonly focus: SelPoint2;
}

/** 一次指针命中的快照；chain 为 root→leaf，x/y 为全局（canvas）坐标 */
export interface HitestResult2 {
  readonly chain: readonly NodeHit2[];
  readonly x: number;
  readonly y: number;
  readonly time: number;
}

/**
 * 一次指针选择会话：按下快照 + 释放快照。
 * - release 为 null 表示仍在按住中：焦点端点跟随 moveHitTest；
 * - release 非 null 表示已松手定格：焦点冻结在释放位置，hover 不再影响选区；
 * - Shift+按下时引擎复用上一会话的 press（锚点继承），仅重新进入按住态。
 */
export interface PointerSelect2 {
  readonly press: HitestResult2 | null;
  readonly release: HitestResult2 | null;
}

/**
 * 宿主上报给指针路由的**纯数据**输入（DOM 事件已被抽干成这四个字段）。
 *
 * 有了这一层，指针状态机（连击 / 双击选词 / 三击选段 / 拖选会话）就不依赖
 * 任何宿主 API：ooc 侧把它的指针事件填成同样四个字段即可复用同一套规则。
 */
export interface PointerInput2 {
  readonly x: number;
  readonly y: number;
  /**
   * 触发本次事件的按键编号（**引擎编号**，不是宿主的原生编号）。
   *
   * 沿用 Kotlin `PointerButton`：1=左 / 2=中 / 3=右，**0 = 无按键**
   * （移动、滚轮、双击这类"不来自某个键"的事件用 0）。
   *
   * 宿主的原生编号各不相同（DOM 是 0=左 / 1=中 / 2=右，Android MotionEvent 是
   * 1/2/3），**翻译由宿主适配器负责**（见 Renderer 的 `engineButtonOf`），
   * 规则层只认引擎编号 —— 移植到 ooc / Rust 时换宿主只需重写这一处翻译。
   */
  readonly button: number;
  /** 按下时是否按住 Shift（锚点继承） */
  readonly shift: boolean;
  /** 事件时间戳（连击窗口判定）；由宿主注入，便于测试与移植时替换时钟 */
  readonly time: number;
  /** 输入设备（鼠标 / 触摸 / 触控笔） */
  readonly device: PointerDevice;
  /** 指针编号（多点触控区分；鼠标恒 0） */
  readonly pointerId: number;
}
